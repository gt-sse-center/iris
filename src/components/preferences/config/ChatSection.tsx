import { useState, forwardRef, useImperativeHandle } from 'react';

interface ChatConfig {
  enabled: boolean;
  github_repo: string;
  utterances_theme: string;
}

// Define the SectionRef interface locally if needed
interface ChatSectionRef {
  getData: () => ChatConfig;
  setData: (data: ChatConfig | undefined) => void;
}

/**
 * Chat Section Component
 * 
 * Manages chat/discussion configuration for per-image discussions via GitHub Issues.
 * Uses Utterances widget for embedding GitHub Issues as comments.
 * 
 * Configuration fields:
 * - enabled: Enable/disable chat feature
 * - github_repo: GitHub repository for storing discussions (format: owner/repo)
 * - utterances_theme: Theme for Utterances widget (github-light, github-dark, etc.)
 */
const ChatSection = forwardRef<ChatSectionRef>((props, ref) => {
  const [enabled, setEnabled] = useState(true);
  const [githubRepo, setGithubRepo] = useState('');
  const [utterancesTheme, setUtterancesTheme] = useState('github-light');

  /**
   * Expose getData and setData methods to parent via ref
   */
  useImperativeHandle(ref, () => ({
    getData: () => {
      return {
        enabled,
        github_repo: githubRepo,
        utterances_theme: utterancesTheme,
      };
    },
    setData: (data: ChatConfig | undefined) => {
      console.log('[ChatSection] setData called with:', data);
      if (data) {
        // Use values from the loaded config
        console.log('[ChatSection] Setting github_repo to:', data.github_repo);
        setEnabled(data.enabled ?? true);
        setGithubRepo(data.github_repo || '');
        setUtterancesTheme(data.utterances_theme || 'github-light');
      } else {
        // If no chat config exists in the file, show empty/default values
        console.log('[ChatSection] No chat config provided, using defaults');
        setEnabled(true);
        setGithubRepo(''); // Empty placeholder
        setUtterancesTheme('github-light');
      }
    },
  }));

  const themeOptions = [
    { value: 'github-light', label: 'GitHub Light' },
    { value: 'github-dark', label: 'GitHub Dark' },
    { value: 'preferred-color-scheme', label: 'Preferred Color Scheme' },
    { value: 'github-dark-orange', label: 'GitHub Dark Orange' },
    { value: 'icy-dark', label: 'Icy Dark' },
    { value: 'dark-blue', label: 'Dark Blue' },
    { value: 'photon-dark', label: 'Photon Dark' },
  ];

  return (
    <>
      <div
        className="accordion checked"
        onClick={(e) => {
          const panel = e.currentTarget.nextElementSibling as HTMLElement;
          const isVisible = panel.style.display === 'block';
          panel.style.display = isVisible ? 'none' : 'block';
          e.currentTarget.classList.toggle('checked');
        }}
      >
        Chat
      </div>
      <div className="panel" style={{ display: 'block' }}>
          <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
            Configure per-image discussions using GitHub Issues via Utterances.
            Each image gets its own discussion thread stored as a GitHub Issue.
          </p>

          {/* Enabled */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
              Enabled
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Enable chat feature</span>
            </label>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
              Enable or disable the chat feature
            </div>
          </div>

          {/* GitHub Repository */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
              GitHub Repository {enabled && <span style={{ color: '#dc3545' }}>*</span>}
            </label>
            <input
              type="text"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="owner/repository"
              disabled={!enabled}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                opacity: enabled ? 1 : 0.6,
              }}
            />
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
              GitHub repository for storing discussions (format: owner/repo). Must be public and have Utterances app installed.
            </div>
            {enabled && !githubRepo && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc3545' }}>
                GitHub repository is required when chat is enabled
              </div>
            )}
            {enabled && githubRepo && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                Install Utterances app: <a href="https://github.com/apps/utterances" target="_blank" rel="noopener noreferrer">github.com/apps/utterances</a>
              </div>
            )}
          </div>

          {/* Utterances Theme */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
              Theme
            </label>
            <select
              value={utterancesTheme}
              onChange={(e) => setUtterancesTheme(e.target.value)}
              disabled={!enabled}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                opacity: enabled ? 1 : 0.6,
                cursor: enabled ? 'pointer' : 'not-allowed',
              }}
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
              Visual theme for the Utterances comment widget
            </div>
          </div>

          {/* Help text */}
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#004085',
          }}>
            <strong>Setup Instructions:</strong>
            <ol style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
              <li>Create a public GitHub repository (or use an existing one)</li>
              <li>Install the Utterances app: <a href="https://github.com/apps/utterances" target="_blank" rel="noopener noreferrer">github.com/apps/utterances</a></li>
              <li>Grant Utterances access to your repository</li>
              <li>Enter the repository name above (format: owner/repo)</li>
              <li>Save configuration and reload the page</li>
            </ol>
          </div>
      </div>
    </>
  );
});

ChatSection.displayName = 'ChatSection';

export default ChatSection;
