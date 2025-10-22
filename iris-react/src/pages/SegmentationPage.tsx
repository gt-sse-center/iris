import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchCurrentUser,
  fetchSegmentationBootstrap,
  fetchConfig,
  fetchImageInfo,
  loadMask,
  fetchNextImageId,
  fetchPreviousImageId,
  loginUser,
  registerUser,
  fetchMetadata,
  fetchHelpContent,
  saveMask
} from "../api/segmentation";
import type { LoadedMask } from "../api/segmentation";
import type { ImageInfoSummary, IrisConfig, IrisUser } from "../api/types";
import { useUI } from "../context/UIContext";
import "../styles/segmentation.css";
import { ApiError } from "../api/client";
import CanvasWorkspace from "../components/CanvasWorkspace";
import MaskOverlay from "../components/MaskOverlay";
import MetadataView from "../components/MetadataView";
import { buildBackendUrl } from "../api/base";

type ToolType = "move" | "draw" | "eraser";
type MaskDisplayMode = "final" | "user" | "errors";
interface FilterState {
  contrast: boolean;
  invert: boolean;
  brightness: number;
  saturation: number;
}

const DEFAULT_FILTERS: FilterState = {
  contrast: false,
  invert: false,
  brightness: 100,
  saturation: 100
};

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const MAX_HISTORY_ENTRIES = 30;

const computeDrawStats = (mask: Uint8Array, userMask: Uint8Array, classCount: number): DrawStats => {
  const classCounts = Array.from({ length: classCount }, () => 0);
  let total = 0;
  for (let i = 0; i < userMask.length; i++) {
    if (userMask[i]) {
      total += 1;
      const cls = mask[i];
      if (cls < classCounts.length) {
        classCounts[cls] += 1;
      }
    }
  }
  return { total, classCounts };
};

const createMaskState = (maskShape: [number, number], maskResult: LoadedMask | null) => {
  const size = maskShape[0] * maskShape[1];
  const finalMask = maskResult ? new Uint8Array(maskResult.finalMask) : new Uint8Array(size);
  const userMask = maskResult ? new Uint8Array(maskResult.userMask) : new Uint8Array(size);
  return {
    finalMask,
    userMask,
    maskAvailable: Boolean(maskResult)
  };
};

interface CommandDefinition {
  key?: string;
  description: string;
}

const COMMANDS: Record<string, CommandDefinition> = {
  previous_image: { key: "Backspace", description: "Save this image and open previous one" },
  next_image: { key: "Return", description: "Save this image and open next one" },
  save_mask: { key: "S", description: "Save current mask" },
  undo: { key: "U", description: "Undo last modification" },
  redo: { key: "R", description: "Redo modification" },
  select_class: { key: "1 .. 9", description: "Select class for drawing" },
  tool_move: { key: "W", description: "Pan current view" },
  tool_reset_views: { key: "Z", description: "Reset all views" },
  tool_draw: { key: "D", description: "Draw pixels" },
  tool_eraser: { key: "E", description: "Erase previously drawn pixels" },
  reset_mask: { key: "N", description: "Clear the whole mask" },
  predict_mask: { key: "A", description: "AI prediction" },
  toggle_mask: { key: "Space", description: "Toggle mask on/off" },
  mask_final: { key: "F", description: "Show final mask" },
  mask_user: { key: "G", description: "Show user mask" },
  mask_errors: { key: "H", description: "Show mask errors" },
  toggle_contrast: { key: "C", description: "Toggle contrast" },
  toggle_invert: { key: "I", description: "Toggle inversion" },
  brightness_up: { key: "Arrow-Up", description: "Increase brightness" },
  brightness_down: { key: "Arrow-Down", description: "Decrease brightness" },
  saturation_up: { key: "Arrow-Right", description: "Increase saturation" },
  saturation_down: { key: "Arrow-Left", description: "Decrease saturation" },
  reset_filters: { key: "X", description: "Reset filters" },
  show_view_controls: { key: "V", description: "Toggle view controls" },
  next_view_group: { key: "B", description: "Show next view group" }
};

interface AuthDialogProps {
  onSuccess: () => void;
}

function AuthDialog({ onSuccess }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        await loginUser(username.trim(), password);
      } else {
        await registerUser(username.trim(), password);
      }
      onSuccess();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Authentication failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setError(null);
  };

  const canSubmit = username.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ margin: 0 }}>
        {mode === "login"
          ? "Log in with your IRIS credentials to continue."
          : "Create a new account to start labelling."}
      </p>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span>Username</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoFocus
          required
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {error && (
        <div style={{ color: "#bb0000", fontWeight: "bold", fontSize: 14 }}>
          {error}
        </div>
      )}

      <button type="submit" className="button" disabled={!canSubmit}>
        {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
      </button>

      <button type="button" className="button" onClick={toggleMode} disabled={submitting}>
        {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
      </button>
    </form>
  );
}

interface MaskHistoryEntry {
  mask: Uint8Array;
  user: Uint8Array;
}

interface DrawStats {
  total: number;
  classCounts: number[];
}

interface SegmentationState {
  user: IrisUser | null;
  config: IrisConfig | null;
  imageId: string | null;
  imageLocation: [number, number];
  imageInfo: ImageInfoSummary | null;
  maskPixels: Uint8Array | null;
  userMaskPixels: Uint8Array | null;
  maskAvailable: boolean;
  currentClass: number;
  tool: ToolType;
  showMask: boolean;
  maskDisplay: MaskDisplayMode;
  loading: boolean;
  authRequired: boolean;
  metadata: Record<string, unknown> | null;
  filters: FilterState;
  history: MaskHistoryEntry[];
  historyIndex: number;
  isDirty: boolean;
  drawStats: DrawStats;
  error?: string;
}

const initialState: SegmentationState = {
  user: null,
  config: null,
  imageId: null,
  imageLocation: [0, 0],
  imageInfo: null,
  maskPixels: null,
  userMaskPixels: null,
  maskAvailable: false,
  currentClass: 0,
  tool: "draw",
  showMask: true,
  maskDisplay: "final",
  loading: true,
  authRequired: false,
  metadata: null,
  filters: { ...DEFAULT_FILTERS },
  history: [],
  historyIndex: -1,
  isDirty: false,
  drawStats: { total: 0, classCounts: [] }
};

function SegmentationPage() {
  const [state, setState] = useState<SegmentationState>(initialState);
  const [searchParams, setSearchParams] = useSearchParams();
  const { showLoader, hideLoader, showMessage, showDialogue, hideDialogue } = useUI();
  const loginPromptedRef = useRef(false);
  const [authRefresh, setAuthRefresh] = useState(0);

  const handleAuthSuccess = useCallback(() => {
    loginPromptedRef.current = false;
    hideDialogue();
    showMessage("Authentication successful!");
    setState((prev) => ({
      ...prev,
      loading: true,
      authRequired: false,
      error: undefined
    }));
    setAuthRefresh((prev) => prev + 1);
  }, [hideDialogue, showMessage]);

  const promptLogin = useCallback(() => {
    if (loginPromptedRef.current) {
      return;
    }
    loginPromptedRef.current = true;

    setState((prev) => ({
      ...prev,
      loading: false,
      authRequired: true,
      user: null,
      config: null,
      imageId: null,
      imageLocation: [0, 0],
      imageInfo: null,
      maskData: null,
      maskAvailable: false,
      currentClass: 0,
      tool: "draw",
      showMask: true,
      maskDisplay: "final",
      metadata: null,
      filters: { ...DEFAULT_FILTERS }
    }));

    showDialogue({
      title: "Authentication required",
      closable: false,
      content: <AuthDialog onSuccess={handleAuthSuccess} />
    });
  }, [handleAuthSuccess, showDialogue]);

  const currentClassName = useMemo(() => {
    if (!state.config?.classes?.length) {
      return "No class";
    }
    const klass = state.config.classes[state.currentClass];
    return klass ? klass.name : "No class";
  }, [state.config, state.currentClass]);

  const aiScore = useMemo(() => {
    const score = state.imageInfo?.segmentation?.current_user_score;
    if (score === null || score === undefined) {
      return "0";
    }
    return `${score}`;
  }, [state.imageInfo]);

  const currentImageQuery = searchParams.get("image_id");
  const maskShape = state.config?.segmentation?.mask_shape ?? null;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        showLoader("Fetching user information...");
        const user = await fetchCurrentUser();
        const config = await fetchConfig(user);

        if (!config) {
          throw new Error("Unable to load configuration for current user.");
        }

        let imageId = currentImageQuery;
        showLoader("Preparing segmentation workspace...");
        const bootstrapInfo = await fetchSegmentationBootstrap(imageId);
        imageId = bootstrapInfo.imageId;

        if (!imageId) {
          throw new Error("Unable to determine image id.");
        }

        if (!currentImageQuery) {
          setSearchParams({ image_id: imageId }, { replace: true });
        }

        const imageInfo = await fetchImageInfo(imageId);
        const mask = await loadMask(imageId);
        const maskShapeFromConfig = config.segmentation?.mask_shape as [number, number];
        if (!maskShapeFromConfig) {
          throw new Error("Project configuration missing segmentation mask shape");
        }
        const maskState = createMaskState(maskShapeFromConfig, mask);
        const historyEntry: MaskHistoryEntry = {
          mask: new Uint8Array(maskState.finalMask),
          user: new Uint8Array(maskState.userMask)
        };
        const drawStats = computeDrawStats(maskState.finalMask, maskState.userMask, config.classes?.length ?? 0);
        let metadata: Record<string, unknown> | null = null;
        try {
          metadata = await fetchMetadata(imageId);
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 404)) {
            // eslint-disable-next-line no-console
            console.warn("Failed to fetch metadata:", err);
          }
        }

        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            user,
            config,
            imageId,
            imageLocation: bootstrapInfo.imageLocation,
            imageInfo,
            maskPixels: maskState.finalMask,
            userMaskPixels: maskState.userMask,
            maskAvailable: maskState.maskAvailable,
            loading: false,
            authRequired: false,
            metadata,
            filters: prev.filters,
            history: [historyEntry],
            historyIndex: 0,
            isDirty: false,
            drawStats,
            error: undefined
          }));
          document.title = `iris | segmentation | ${imageId}`;
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error instanceof ApiError && error.status === 403) {
          promptLogin();
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        // Log the exact error to help diagnose fetch/proxy issues
        // eslint-disable-next-line no-console
        console.error("Segmentation bootstrap failed:", error);
        setState((prev) => ({
          ...prev,
          loading: false,
          authRequired: false,
          error: message
        }));
        showMessage(`Failed to initialise segmentation workspace: ${message}`);
      } finally {
        if (!cancelled) {
          hideLoader();
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [authRefresh, currentImageQuery, hideLoader, promptLogin, setSearchParams, showLoader, showMessage]);

  const reloadImage = useCallback(
    async (imageId: string) => {
      showLoader("Loading image data...");
      try {
        const bootstrapInfo = await fetchSegmentationBootstrap(imageId);
        const imageInfo = await fetchImageInfo(bootstrapInfo.imageId);
        const mask = await loadMask(bootstrapInfo.imageId);
        let metadata: Record<string, unknown> | null = null;
        try {
          metadata = await fetchMetadata(bootstrapInfo.imageId);
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 404)) {
            // eslint-disable-next-line no-console
            console.warn("Failed to fetch metadata:", err);
          }
        }
        setState((prev) => {
          if (!prev.config) {
            return prev;
          }
          const maskShapeFromConfig = prev.config.segmentation?.mask_shape as [number, number];
          if (!maskShapeFromConfig) {
            return prev;
          }
          const maskState = createMaskState(maskShapeFromConfig, mask);
          const historyEntry: MaskHistoryEntry = {
            mask: new Uint8Array(maskState.finalMask),
            user: new Uint8Array(maskState.userMask)
          };
          const drawStats = computeDrawStats(
            maskState.finalMask,
            maskState.userMask,
            prev.config.classes?.length ?? 0
          );
          return {
            ...prev,
            imageId: bootstrapInfo.imageId,
            imageLocation: bootstrapInfo.imageLocation,
            imageInfo,
            maskPixels: maskState.finalMask,
            userMaskPixels: maskState.userMask,
            maskAvailable: maskState.maskAvailable,
            history: [historyEntry],
            historyIndex: 0,
            isDirty: false,
            metadata,
            drawStats,
            authRequired: false,
            filters: prev.filters
          };
        });
        setSearchParams({ image_id: bootstrapInfo.imageId }, { replace: true });
        document.title = `iris | segmentation | ${bootstrapInfo.imageId}`;
      } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          // eslint-disable-next-line no-console
          console.error("Failed to reload image:", error);
          showMessage(`Unable to load image: ${message}`);
      } finally {
        hideLoader();
      }
    },
    [hideLoader, setSearchParams, showLoader, showMessage]
  );

  const handleNextImage = useCallback(async () => {
    if (!state.imageId) {
      return;
    }
    try {
      showLoader("Loading next image...");
      const nextId = await fetchNextImageId(state.imageId);
      await reloadImage(nextId);
    } catch (error) {
      showMessage(`Unable to load next image: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      hideLoader();
    }
  }, [hideLoader, reloadImage, showLoader, showMessage, state.imageId]);

  const handlePreviousImage = useCallback(async () => {
    if (!state.imageId) {
      return;
    }
    try {
      showLoader("Loading previous image...");
      const previousId = await fetchPreviousImageId(state.imageId);
      await reloadImage(previousId);
    } catch (error) {
      showMessage(`Unable to load previous image: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      hideLoader();
    }
  }, [hideLoader, reloadImage, showLoader, showMessage, state.imageId]);

  const handleSaveMask = useCallback(async () => {
    if (!state.imageId || !state.maskPixels || !state.userMaskPixels) {
      showMessage("No mask edits to save yet.");
      return;
    }

    try {
      showLoader("Saving mask...");
      const length = state.maskPixels.length;
      const payload = new Uint8Array(2 * length + 2);
      payload[0] = 254;
      payload.set(state.maskPixels, 1);
      for (let i = 0; i < length; i++) {
        payload[1 + length + i] = state.userMaskPixels[i] ? 1 : 0;
      }
      payload[payload.length - 1] = 254;
      await saveMask(state.imageId, payload);
      setState((prev) => ({ ...prev, isDirty: false }));
      showMessage("Mask saved successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showMessage(`Unable to save mask: ${message}`);
    } finally {
      hideLoader();
    }
  }, [hideLoader, showLoader, showMessage, state.imageId, state.maskPixels, state.userMaskPixels]);

  const handleUndo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex <= 0) {
        return prev;
      }
      const newIndex = prev.historyIndex - 1;
      const entry = prev.history[newIndex];
      const mask = new Uint8Array(entry.mask);
      const userMask = new Uint8Array(entry.user);
      const drawStats = computeDrawStats(mask, userMask, prev.config?.classes?.length ?? 0);
      return {
        ...prev,
        maskPixels: mask,
        userMaskPixels: userMask,
        historyIndex: newIndex,
        isDirty: true,
        drawStats
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) {
        return prev;
      }
      const newIndex = prev.historyIndex + 1;
      const entry = prev.history[newIndex];
      const mask = new Uint8Array(entry.mask);
      const userMask = new Uint8Array(entry.user);
      const drawStats = computeDrawStats(mask, userMask, prev.config?.classes?.length ?? 0);
      return {
        ...prev,
        maskPixels: mask,
        userMaskPixels: userMask,
        historyIndex: newIndex,
        isDirty: true,
        drawStats
      };
    });
  }, []);

  const handleResetMask = useCallback(() => {
    setState((prev) => {
      if (!prev.maskPixels || !prev.userMaskPixels || !prev.config) {
        return prev;
      }
      const mask = new Uint8Array(prev.maskPixels.length);
      const userMask = new Uint8Array(prev.userMaskPixels.length);
      const drawStats = computeDrawStats(mask, userMask, prev.config.classes?.length ?? 0);
      const trimmed = [...prev.history.slice(0, prev.historyIndex + 1), { mask: new Uint8Array(mask), user: new Uint8Array(userMask) }];
      if (trimmed.length > MAX_HISTORY_ENTRIES) {
        trimmed.splice(0, trimmed.length - MAX_HISTORY_ENTRIES);
      }
      return {
        ...prev,
        maskPixels: mask,
        userMaskPixels: userMask,
        maskAvailable: false,
        history: trimmed,
        historyIndex: trimmed.length - 1,
        isDirty: true,
        drawStats
      };
    });
  }, []);

  const handleSelectClass = useCallback(() => {
    if (!state.config?.classes?.length) {
      showMessage("No classes available in configuration.");
      return;
    }

    showDialogue({
      title: "Select class",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {state.config.classes.map((klass, index) => (
            <button
              key={`${klass.name}-${index}`}
              type="button"
              className="button"
              onClick={() => {
                setState((prev) => ({
                  ...prev,
                  currentClass: index
                }));
                hideDialogue();
              }}
            >
              {klass.name}
            </button>
          ))}
        </div>
      )
    });
  }, [hideDialogue, showDialogue, showMessage, state.config?.classes]);

  const handleSetTool = useCallback(
    (tool: ToolType) => {
      setState((prev) => ({
        ...prev,
        tool
      }));
    },
    [setState]
  );

  const handleToggleMask = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showMask: !prev.showMask
    }));
  }, []);

  const updateFilters = useCallback((updater: (filters: FilterState) => FilterState) => {
    setState((prev) => ({
      ...prev,
      filters: updater(prev.filters)
    }));
  }, []);

  const handleMaskEdit = useCallback(
    (mutator: (mask: Uint8Array, userMask: Uint8Array) => boolean, options: { pushHistory?: boolean } = {}) => {
      setState((prev) => {
        if (!prev.maskPixels || !prev.userMaskPixels || !prev.config) {
          return prev;
        }

        const maskClone = new Uint8Array(prev.maskPixels);
        const userClone = new Uint8Array(prev.userMaskPixels);
        const changed = mutator(maskClone, userClone);

        if (!changed && !options.pushHistory) {
          return prev;
        }

        const nextMask = changed ? maskClone : new Uint8Array(prev.maskPixels);
        const nextUser = changed ? userClone : new Uint8Array(prev.userMaskPixels);

        let history = prev.history;
        let historyIndex = prev.historyIndex;
        if (options.pushHistory) {
          const trimmed = [...history.slice(0, historyIndex + 1), { mask: new Uint8Array(nextMask), user: new Uint8Array(nextUser) }];
          if (trimmed.length > MAX_HISTORY_ENTRIES) {
            trimmed.splice(0, trimmed.length - MAX_HISTORY_ENTRIES);
          }
          history = trimmed;
          historyIndex = trimmed.length - 1;
        }

        const drawStats = computeDrawStats(nextMask, nextUser, prev.config.classes?.length ?? 0);

        return {
          ...prev,
          maskPixels: nextMask,
          userMaskPixels: nextUser,
          history,
          historyIndex,
          isDirty: true,
          maskAvailable: prev.maskAvailable || changed,
          drawStats
        };
      });
    },
    []
  );

  const handleToggleContrast = useCallback(() => {
    updateFilters((filters) => ({
      ...filters,
      contrast: !filters.contrast
    }));
  }, [updateFilters]);

  const handleToggleInvert = useCallback(() => {
    updateFilters((filters) => ({
      ...filters,
      invert: !filters.invert
    }));
  }, [updateFilters]);

  const handleAdjustBrightness = useCallback(
    (delta: number) => {
      updateFilters((filters) => ({
        ...filters,
        brightness: clampValue(filters.brightness + delta, 10, 300)
      }));
    },
    [updateFilters]
  );

  const handleAdjustSaturation = useCallback(
    (delta: number) => {
      updateFilters((filters) => ({
        ...filters,
        saturation: clampValue(filters.saturation + delta, 0, 300)
      }));
    },
    [updateFilters]
  );

  const handleResetFilters = useCallback(() => {
    updateFilters(() => ({ ...DEFAULT_FILTERS }));
  }, [updateFilters]);

  const handleShowHelp = useCallback(async () => {
    try {
      showLoader("Loading help...");
      const hotkeys = Object.values(COMMANDS).reduce<Record<string, string>>((acc, command) => {
        if (command.key) {
          acc[command.key] = command.description;
        }
        return acc;
      }, {});

      const html = await fetchHelpContent(hotkeys);
      showDialogue({
        title: "Help",
        content: <div dangerouslySetInnerHTML={{ __html: html }} />
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showMessage(`Unable to load help: ${message}`);
    } finally {
      hideLoader();
    }
  }, [hideLoader, showDialogue, showLoader, showMessage]);

  const handleShowConfig = useCallback(() => {
    showDialogue({
      title: "Preferences",
      content: (
        <div>
          <p>User configuration editing is not yet implemented in the React port.</p>
        </div>
      )
    });
  }, [showDialogue]);

  const handleShowImageInfo = useCallback(() => {
    if (!state.imageId) {
      showMessage("No image selected.");
      return;
    }

    if (!state.metadata || Object.keys(state.metadata).length === 0) {
      showMessage("No metadata available for this image.");
      return;
    }

    showDialogue({
      title: `Image ${state.imageId}`,
      content: <MetadataView data={state.metadata as Record<string, unknown>} />
    });
  }, [showDialogue, showMessage, state.imageId, state.metadata]);

  const handleShowUser = useCallback(() => {
    if (!state.user) {
      promptLogin();
      return;
    }

    const createdDate = state.user.created ? new Date(state.user.created) : null;
    const segmentationStats = state.user.segmentation;
    const config = state.config;

    showDialogue({
      title: `User ${state.user.name}`,
      content: (
        <div className="user-dialog">
          <div className="user-dialog-section user-dialog-grid">
            <div className="user-dialog-card">
              <h4>Account</h4>
              <p>
                <strong>Role:</strong> {state.user.admin ? "Administrator" : "Annotator"}
              </p>
              {createdDate && (
                <p>
                  <strong>Created:</strong> {createdDate.toLocaleString()}
                </p>
              )}
              <p>
                <strong>Tested:</strong> {state.user.tested ? "Yes" : "No"}
              </p>
            </div>
            <div className="user-dialog-card">
              <h4>Segmentation</h4>
              <p>
                <strong>Masks:</strong> {segmentationStats.n_masks}
              </p>
              <p>
                <strong>Score (verified):</strong> {segmentationStats.score}
              </p>
              <p>
                <strong>Score (unverified):</strong> {segmentationStats.score_unverified}
              </p>
            </div>
            {config && (
              <div className="user-dialog-card">
                <h4>Project</h4>
                <p>
                  <strong>Name:</strong> {config.name}
                </p>
                <p>
                  <strong>Host:</strong> {config.host}:{config.port}
                </p>
                <p>
                  <strong>Views:</strong> {Object.keys(config.views ?? {}).length}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    });
  }, [promptLogin, showDialogue, state.config, state.user]);

  if (state.loading) {
    return null;
  }

  if (state.authRequired) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Authentication required</h2>
        <p>You must log in to access the segmentation workspace.</p>
        <button type="button" className="button" onClick={promptLogin}>
          Open login dialog
        </button>
      </div>
    );
  }

  if (state.error) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Unable to load segmentation workspace</h2>
        <p>{state.error}</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="toolbar" id="toolbar">
        <li className="toolbutton icon_button" id="tb_previous_image" onClick={handlePreviousImage}>
          <img src="/icons/previous.png" className="icon" alt="Previous image" />
        </li>
        <li className="toolbutton icon_button" id="tb_next_image" onClick={handleNextImage}>
          <img src="/icons/next.png" className="icon" alt="Next image" />
        </li>
        <li className="toolbutton icon_button" id="tb_save_mask" onClick={handleSaveMask}>
          <img src="/icons/save_mask.png" className="icon" alt="Save mask" />
        </li>
        <li className="toolbutton icon_button" id="tb_undo" onClick={handleUndo}>
          <img src="/icons/undo.png" className="icon" alt="Undo" />
        </li>
        <li className="toolbutton icon_button" id="tb_redo" onClick={handleRedo}>
          <img src="/icons/redo.png" className="icon" alt="Redo" />
        </li>
        <li className="toolbar_separator" />
        <li className="toolbutton icon_button" id="tb_select_class" onClick={handleSelectClass} style={{ width: 200 }}>
          <div>
            <img src="/icons/class.png" className="icon" style={{ float: "left" }} alt="Select class" />
          </div>
          <div id="tb_current_class" style={{ float: "left", lineHeight: "28px", fontSize: 18, fontWeight: "normal" }}>
            {currentClassName}
          </div>
        </li>
        <li className="toolbar_separator" />
        <li
          className={`toolbutton icon_button ${state.tool === "move" ? "checked" : ""}`}
          id="tb_tool_move"
          onClick={() => handleSetTool("move")}
        >
          <img src="/icons/move.png" className="icon" alt="Move tool" />
        </li>
        <li className="toolbutton icon_button" id="tb_tool_reset_views" onClick={() => showMessage("Reset view not yet available.")}>
          <img src="/icons/reset_views.png" className="icon" alt="Reset views" />
        </li>
        <li
          className={`toolbutton icon_button ${state.tool === "draw" ? "checked" : ""}`}
          id="tb_tool_draw"
          onClick={() => handleSetTool("draw")}
        >
          <img src="/icons/pencil.png" className="icon" alt="Draw tool" />
        </li>
        <li
          className={`toolbutton icon_button ${state.tool === "eraser" ? "checked" : ""}`}
          id="tb_tool_eraser"
          onClick={() => handleSetTool("eraser")}
        >
          <img src="/icons/eraser.png" className="icon" alt="Eraser tool" />
        </li>
        <li className="toolbutton icon_button" id="tb_reset_mask" onClick={handleResetMask}>
          <img src="/icons/reset_mask.png" className="icon" alt="Reset mask" />
        </li>
        <li className="toolbutton icon_button" id="tb_toggle_mask" onClick={handleToggleMask}>
          <img src="/icons/show_mask.png" className="icon" alt="Toggle mask" />
        </li>
        <li className="toolbutton icon_button" id="tb_mask_final" onClick={() => setState((prev) => ({ ...prev, maskDisplay: "final" }))}>
          <img src="/icons/mask_final.png" className="icon" alt="Final mask" />
        </li>
        <li className="toolbutton icon_button" id="tb_mask_user" onClick={() => setState((prev) => ({ ...prev, maskDisplay: "user" }))}>
          <img src="/icons/mask_user.png" className="icon" alt="User mask" />
        </li>
        <li className="toolbutton icon_button" id="tb_mask_errors" onClick={() => setState((prev) => ({ ...prev, maskDisplay: "errors" }))}>
          <img src="/icons/mask_errors.png" className="icon" alt="Mask errors" />
        </li>
        <li className="toolbar_separator" />
        <li className="toolbutton icon_button" id="tb_ai_predict" onClick={() => showMessage("AI prediction not yet available.")}>
          <img src="/icons/ai.png" className="icon" alt="AI predict" />
        </li>
        <li className="toolbutton icon_button" id="tb_brightness_up" onClick={() => handleAdjustBrightness(10)}>
          <img src="/icons/brightness_up.png" className="icon" alt="Brightness up" />
        </li>
        <li className="toolbutton icon_button" id="tb_brightness_down" onClick={() => handleAdjustBrightness(-10)}>
          <img src="/icons/brightness_down.png" className="icon" alt="Brightness down" />
        </li>
        <li className="toolbutton icon_button" id="tb_saturation_up" onClick={() => handleAdjustSaturation(50)}>
          <img src="/icons/saturation_up.png" className="icon" alt="Saturation up" />
        </li>
        <li className="toolbutton icon_button" id="tb_saturation_down" onClick={() => handleAdjustSaturation(-50)}>
          <img src="/icons/saturation_down.png" className="icon" alt="Saturation down" />
        </li>
        <li
          className={`toolbutton icon_button ${state.filters.contrast ? "checked" : ""}`}
          id="tb_toggle_contrast"
          onClick={handleToggleContrast}
        >
          <img src="/icons/contrast.png" className="icon" alt="Toggle contrast" />
        </li>
        <li
          className={`toolbutton icon_button ${state.filters.invert ? "checked" : ""}`}
          id="tb_toggle_invert"
          onClick={handleToggleInvert}
        >
          <img src="/icons/invert.png" className="icon" alt="Toggle invert" />
        </li>
        <li className="toolbutton icon_button" id="tb_reset_filters" onClick={handleResetFilters}>
          <img src="/icons/reset_filters.png" className="icon" alt="Reset filters" />
        </li>
        <li className="toolbar_separator" />
        <li className="toolbutton icon_button" onClick={handleShowHelp}>
          <img src="/icons/help.png" className="icon" alt="Help" />
        </li>
        <li className="toolbutton icon_button" onClick={handleShowConfig}>
          <img src="/icons/preferences.png" className="icon" alt="Preferences" />
        </li>
      </ul>
      <div id="views-container" style={{ margin: "10px 0px", width: "100%" }}>
        {state.imageId && state.config ? (
          <>
            <CanvasWorkspace
              config={state.config!}
              imageId={state.imageId}
              maskShape={maskShape}
              maskArea={state.config!.segmentation.mask_area as [number, number, number, number]}
              maskData={state.maskPixels}
              userMask={state.userMaskPixels}
              showMask={state.showMask}
              maskDisplay={state.maskDisplay}
              tool={state.tool}
              filters={state.filters}
              activeClassIndex={state.currentClass}
              onMaskEdit={handleMaskEdit}
            />
            <div style={{ marginTop: "16px" }}>
              <h3 style={{ marginBottom: "8px" }}>Mask preview</h3>
              <MaskOverlay
                config={state.config}
                maskData={state.maskPixels}
                maskShape={maskShape}
                showMask={state.showMask}
                mode={state.maskDisplay}
              />
            </div>
          </>
        ) : (
          <div
            style={{
              border: "1px dashed #999",
              padding: "24px",
              textAlign: "center",
              marginTop: "12px"
            }}
          >
            Loading views...
          </div>
        )}
      </div>

      <div id="statusbar" className="statusbar" style={{ position: "fixed", bottom: 10, zIndex: 10 }}>
        <div className="statusbutton" onClick={handleShowUser} id="user-info">
          <div style={{ float: "left" }}>{state.user ? state.user.name : "Login"}</div>
        </div>
        <div
          className="statusbutton"
          id="admin-button"
          onClick={() => window.open(buildBackendUrl("/admin/"), "_blank", "noopener")}
          style={{ fontSize: 20 }}
        >
          <div>Admin</div>
        </div>
        <div className="statusbutton" style={{ minWidth: 150 }} onClick={handleShowImageInfo} id="image-info">
          <div className="info-box-top">{state.imageId ?? "-"}</div>
          <div className="info-box-bottom">image-ID</div>
        </div>
        <div className="complete-statusbutton">
          <div id="different-classes" className="info-box-top">
            {state.config?.classes?.length ?? 0}
          </div>
          <div className="info-box-bottom">Classes</div>
        </div>
        <div className="complete-statusbutton">
          <div id="drawn-pixels" className="info-box-top">0</div>
          <div className="info-box-bottom">Drawn pixels</div>
        </div>
        <div className="statusbutton" onClick={() => showMessage("Confusion matrix not yet available.")}>
          <div id="ai-score" className="info-box-top">
            {aiScore}
          </div>
          <div className="info-box-bottom">AI-Score</div>
        </div>
        <div className="info-box">
          <img style={{ float: "left" }} src="/icons/ai.png" alt="AI status" />
          <div style={{ fontSize: 16, float: "left", marginLeft: 10 }} id="ai-recommendation">
            {state.maskAvailable ? "AI prediction ready" : "AI requires input"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SegmentationPage;
