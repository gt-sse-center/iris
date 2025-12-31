/*Instead of 2D arrays we are going to use flattened 1D arrays for perfomance
reasons, i.e. array_2d[y][x] is going to be array_1d[y*row_length+x]*/


let commands = {
    "previous_image": {
        "key": "Backspace",
        "description": "Save this image and open previous one"
    },
    "next_image": {
        "key": "Return",
        "description": "Save this image and open next one"
    },
    "save_mask": {
        "key": "S",
        "description": "Save this mask"
    },
    "undo": {
        "key": "U",
        "description": "Undo last modification"
    },
    "redo": {
        "key": "R",
        "description": "Redo modification"
    },
    "select_class": {
        "key": "1 .. 9",
        "description": "Select class for drawing"
    },
    "tool_move": {
        "key": "W",
        "description": "Pan your current view by dragging and moving the cursor"
    },
    "tool_reset_views": {
        "key": "Z",
        "description": "Reset the view in the canvases"
    },
    "tool_draw": {
        "key": "D",
        "description": "Draw pixels on the mask"
    },
    "tool_eraser": {
        "key": "E",
        "description": "Erase previously drawn pixels"
    },
    "reset_mask": {
        "key": "N",
        "description": "Clear the whole mask"
    },
    "predict_mask": {
        "key": "A",
        "description": "Use the AI to help you filling out the mask"
    },
    "toggle_mask": {
        "key": "Space",
        "description": "Toggle mask on/off"
    },
    "mask_final": {
        "key": "F",
        "description": "Show the final mask combined from your pixels and the predictions by the AI"
    },
    "mask_user": {
        "key": "G",
        "description": "Show your drawn pixels only"
    },
    "mask_errors": {
        "key": "H",
        "description": "Show where the AI failed to predict correctly"
    },
    // "mask_highlight_edges": {
    //     "key": "B", "description": "Highlight edges on the masks",
    // },
    "toggle_contrast": {
        "key": "C", 
        "description": "Toggle contrast on/off"
    },
    "toggle_invert": {
        "key": "I", 
        "description": "Toggle inversion on/off"
    },
    "brightness_up": {
        "key": "Arrow-Up", 
        "description": "Increase brightness (+10%)"
    },
    "brightness_down": {
        "key": "Arrow-Down", 
        "description": "Decrease brightness (-10%)"
    },
    "saturation_up": {
        "key": "Arrow-Right",
        "description": "Increase saturation (+50%)"
    },
    "saturation_down": {
        "key": "Arrow-Left",
        "description": "Decrease saturation (-50%)"
    },
    "reset_filters": {
        "key": "X",
        "description": "Reset all image filters"
    },
    "show_view_controls": {
        "key": "V",
        "description":"Toggle display of view controls on/off"
    },
    "next_view_group": {
        "key": "B",
        "description": "Switch to next group view"
    }
};

function init_segmentation(){
    show_loader("Fetching user information...");

    // Before we start, we check for the login, etc.
    // Use React store as primary source
    if (window.setNextActionInStore) {
        window.setNextActionInStore(init_views);
    } else {
        // Fallback to legacy vars during initialization
        console.warn('[IRIS Migration] Using legacy vars.next_action fallback');
        vars.next_action = init_views;
    }
    fetch_server_update(update_config=true);
}

function newuser_help_popup(){
    // Open the help menu if the user is new (no saved masks):
    // Use React store as primary source
    let justLoggedIn;
    if (window.getJustLoggedInFromStore) {
        justLoggedIn = window.getJustLoggedInFromStore();
    } else {
        // Fallback to legacy vars during initialization
        console.warn('[IRIS Migration] Using legacy vars.just_logged_in fallback');
        justLoggedIn = vars.just_logged_in;
    }
    
    if (vars.user.segmentation.n_masks == 0 && justLoggedIn == true){
        dialogue_help();
        
        // Set just_logged_in to false using React store as primary
        if (window.setJustLoggedInInStore) {
            window.setJustLoggedInInStore(false);
        } else {
            // Fallback to legacy vars
            console.warn('[IRIS Migration] Using legacy vars.just_logged_in fallback for setting false');
            vars.just_logged_in = false;
        }
    }
}
function save_config(config){
    fetch(vars.url.user+'save_config', {
        method: "POST",
        body: JSON.stringify(config)
    })
}
async function init_views(){
    show_loader("Loading views...");
    vars.vm = new ViewManager(
        get_object('views-container'),
        vars.config.views, vars.config.view_groups,
        vars.url.main+"image/",
        image_aspect_ratio = window.getImageAspectRatioFromStore ? 
            window.getImageAspectRatioFromStore() : 
            (vars.image_shape ? vars.image_shape[0] / vars.image_shape[1] : 1)
    );

    // Add standard layers to all view ports if the view type is not "bingmap":
    vars.vm.addStandardLayer(
        MaskLayer,
        (view) => view.type != "bingmap"
    );
    vars.vm.addStandardLayer(
        PreviewLayer,
        (view) => view.type != "bingmap"
    );

    // It much faster to change some pixel values on a sprite and draw it then
    // to the canvas once than redrawing each pixel to the canvas directly.
    // Hence, we use a hidden canvas for the mask:
    if (window.createHiddenMaskCanvasFromStore) {
        // Use React store for hidden mask canvas creation
        try {
            const maskShape = window.getMaskShapeFromStore ? window.getMaskShapeFromStore() : vars.mask_shape;
            if (maskShape) {
                window.createHiddenMaskCanvasFromStore(maskShape[0], maskShape[1]);
            } else {
                console.warn('[IRIS Migration] No mask shape available, using legacy fallback');
                throw new Error('No mask shape available');
            }
        } catch (error) {
            console.error('[IRIS Migration] Failed to create hidden mask canvas from store:', error);
            // Fallback to legacy approach
            console.warn('[IRIS Migration] Using legacy vars.hidden_mask fallback');
            vars.hidden_mask = document.createElement('canvas');
            const maskShape = window.getMaskShapeFromStore ? window.getMaskShapeFromStore() : vars.mask_shape;
            if (maskShape) {
                vars.hidden_mask.width = maskShape[0];
                vars.hidden_mask.height = maskShape[1];
            } else {
                console.error('[IRIS Migration] No mask shape available for legacy fallback');
                return;
            }
            let hidden_ctx = vars.hidden_mask.getContext('2d');
            hidden_ctx.shadowOffsetX = 0;
            hidden_ctx.shadowOffsetY = 0;
            hidden_ctx.shadowBlur = 0;
            hidden_ctx.shadowColor = null;
            hidden_ctx.imageSmoothingEnabled = false;
        }
    } else {
        console.warn('[IRIS Migration] Using legacy vars.hidden_mask fallback - React store not available');
        vars.hidden_mask = document.createElement('canvas');
        const maskShape = window.getMaskShapeFromStore ? window.getMaskShapeFromStore() : vars.mask_shape;
        if (maskShape) {
            vars.hidden_mask.width = maskShape[0];
            vars.hidden_mask.height = maskShape[1];
        } else {
            console.error('[IRIS Migration] No mask shape available for legacy fallback');
            return;
        }
        let hidden_ctx = vars.hidden_mask.getContext('2d');
        hidden_ctx.shadowOffsetX = 0;
        hidden_ctx.shadowOffsetY = 0;
        hidden_ctx.shadowBlur = 0;
        hidden_ctx.shadowColor = null;
        hidden_ctx.imageSmoothingEnabled = false;
    }

    // Load mask (now properly awaited):
    await load_mask();

    vars.vm.setImage(vars.image_id, vars.image_location);
    vars.vm.showGroup();

    set_tool(vars.tool.type);
    set_current_class(vars.current_class);

    init_events();
    init_toolbar_events();

    reset_views();

    get_object("toolbar").style.visibility = "visible";
    get_object("statusbar").style.visibility = "visible";
    hide_loader(); // Ensure loader is hidden after initialization
    newuser_help_popup();
}

function init_events(){
    document.body.onkeydown = key_down;
    document.body.onkeyup = key_up;
    document.body.onresize = () => vars.vm.updateSize();

    window.addEventListener('unload', (event) => {
      // Cancel the event as stated by the standard.
      event.preventDefault();

      save_mask();

      // Chrome requires returnValue to be set.
      event.returnValue = '';
      return '';
    });
}

function init_toolbar_events(){
    let toolbuttons = document.getElementsByClassName("toolbutton");
    for (let toolbutton of toolbuttons) {
        if (toolbutton.id === null){
            continue;
        }
        let command_id = toolbutton.id.substr(3);
        if (command_id in commands){
            let text = commands[command_id].description;

            if ('key' in commands[command_id]){
                text = '<span class="key">'+commands[command_id].key+'</span> ' + text;
            }

            toolbutton.onmouseenter = show_message.bind(null, text, null);
            toolbutton.onmouseleave = hide_message.bind(null);
        }
    }
}

function key_down(event){
    let key = event.code;

    if (get_object('dialogue').style.display == "block"){
        // Don't allow any key events during an opened dialogue
    }else if (key == "Space"){
        // Use React store instead of vars
        if (window.segmentationStore) {
            window.segmentationStore.getState().toggleMask();
        } else {
            console.warn('Space key pressed but React store not available');
        }
    } else if (key == "KeyS"){
        save_mask();
    } else if (key == "Enter"){
        save_mask(next_image);
    } else if (key == "Backspace"){
        save_mask(prev_image);
    } else if (key == "KeyU"){
        undo();
    } else if (key == "KeyR"){
        redo();
    } else if (key == "KeyC"){
        set_contrast(!vars.vm.filters.contrast);
    } else if (key == "KeyI"){
        set_invert(!vars.vm.filters.invert);
    } else if (key == "ArrowUp"){
        change_brightness(up=true);
    } else if (key == "ArrowDown"){
        change_brightness(up=false);
    } else if (key == "ArrowRight"){
        change_saturation(up=true);
    } else if (key == "ArrowLeft"){
        change_saturation(up=false);
    } else if (key == "KeyX"){
        reset_filters();
    } else if (key == "KeyY"){
        reset_views();
    } else if (key == "KeyA"){
        predict_mask();
    } else if (key == "KeyF"){
        set_mask_type("final");
    } else if (key == "KeyG"){
        set_mask_type("user");
    } else if (key == "KeyH"){
        set_mask_type("errors");
    } else if (key.startsWith("Digit") || key.startsWith("Numpad")){
        // Why do we subtract 1 from this? The class ids start with 0, so we
        // want to make the hotkey easier:
        var class_id = parseInt(key[key.length-1]) - 1;
        if (class_id < vars.classes.length){
            set_current_class(class_id);
        }
    } else if (key == "KeyD"){
        set_tool("draw");
    } else if (key == "KeyE"){
        set_tool("eraser");
    } else if (key == "KeyW"){
        set_tool("move");
    } else if (key == "KeyN"){
        dialogue_reset_mask();
    } else if (key == "KeyV"){
        vars.vm.toggleControls();
    } else if (key == "KeyB"){
        vars.vm.showNextGroup();
    } else if (event.shiftKey){
        // Update tool resizing mode through React store (primary source)
        if (window.segmentationStore) {
            window.segmentationStore.getState().setToolResizingMode(true);
        } else {
            // Fallback to legacy vars during initialization
            console.warn('[IRIS Migration] key_down: Using legacy vars.tool.resizing_mode fallback - React store not available yet');
            vars.tool.resizing_mode = true;
        }
    }
}

function key_up(event){
    // Update tool resizing mode through React store (primary source)
    if (window.segmentationStore) {
        window.segmentationStore.getState().setToolResizingMode(event.shiftKey);
    } else {
        // Fallback to legacy vars during initialization
        console.warn('[IRIS Migration] key_up: Using legacy vars.tool.resizing_mode fallback - React store not available yet');
        vars.tool.resizing_mode = event.shiftKey;
    }
}

function change_brightness(up){
    // Use React store if available (new source of truth)
    if (window.segmentationStore) {
        window.segmentationStore.getState().changeBrightness(up);
        return;
    }
    
    // Fallback to legacy behavior
    console.log('[IRIS] Using legacy brightness fallback, store not available');
    
    // Safety check: only proceed if ViewManager is initialized
    if (!vars.vm || !vars.vm.filters) {
        console.log('[IRIS] ViewManager not initialized, skipping brightness change');
        return;
    }
    
    if (up){
        vars.vm.filters.brightness += 10;
        vars.vm.filters.brightness = Math.min(800, vars.vm.filters.brightness);
    } else {
        vars.vm.filters.brightness -= 10;
        vars.vm.filters.brightness = Math.max(0, vars.vm.filters.brightness);
    }
    vars.vm.render();
}
function change_saturation(up){
    // Use React store if available (new source of truth)
    if (window.segmentationStore) {
        window.segmentationStore.getState().changeSaturation(up);
        return;
    }
    
    // Fallback to legacy behavior
    console.log('[IRIS] Using legacy saturation fallback, store not available');
    
    // Safety check: only proceed if ViewManager is initialized
    if (!vars.vm || !vars.vm.filters) {
        console.log('[IRIS] ViewManager not initialized, skipping saturation change');
        return;
    }
    
    if (up){
        vars.vm.filters.saturation += 20;
        vars.vm.filters.saturation = Math.min(800, vars.vm.filters.saturation);
    } else {
        vars.vm.filters.saturation -= 20;
        vars.vm.filters.saturation = Math.max(0, vars.vm.filters.saturation);
    }
    vars.vm.render();
}

function set_current_class(class_id){
    // PHASE 1: Check React store first (new source of truth)
    if (window.segmentationStore) {
        window.segmentationStore.getState().setCurrentClass(class_id);
        return; // Store handles everything including DOM updates
    }
    
    // FALLBACK: Legacy behavior (should rarely be used)
    console.log('[IRIS] Using legacy set_current_class fallback, store not available');
    vars.current_class = class_id;
    var colour = vars.classes[class_id].colour;
    var css_colour = rgba2css(colour);
    get_object("tb_current_class").innerHTML = vars.classes[class_id].name;
    get_object("tb_select_class").style["background-color"] = css_colour;

    // Convenience - automatically change to drawing tool after selecting class:
    set_tool("draw");
}

function set_contrast(visible){
    // Use React store if available (new source of truth)
    if (window.segmentationStore) {
        window.segmentationStore.getState().setContrast(visible);
        return;
    }
    
    // Fallback to legacy behavior
    console.log('[IRIS] Using legacy contrast fallback, store not available');
    
    // Safety check: only proceed if ViewManager is initialized
    if (!vars.vm || !vars.vm.filters) {
        console.log('[IRIS] ViewManager not initialized, skipping contrast change');
        return;
    }
    
    vars.vm.filters.contrast = visible;

    if (vars.vm.filters.contrast){
        get_object("tb_toggle_contrast").classList.add("checked");
    } else {
        get_object("tb_toggle_contrast").classList.remove("checked");
    }

    vars.vm.render();
}

function set_invert(visible){
    // Use React store if available (new source of truth)
    if (window.segmentationStore) {
        window.segmentationStore.getState().setInvert(visible);
        return;
    }
    
    // Fallback to legacy behavior
    console.log('[IRIS] Using legacy invert fallback, store not available');
    
    // Safety check: only proceed if ViewManager is initialized
    if (!vars.vm || !vars.vm.filters) {
        console.log('[IRIS] ViewManager not initialized, skipping invert change');
        return;
    }
    
    vars.vm.filters.invert = visible;

    if (vars.vm.filters.invert){
        get_object("tb_toggle_invert").classList.add("checked");
    } else {
        get_object("tb_toggle_invert").classList.remove("checked");
    }

    vars.vm.render();
}

function set_tool(tool){
    // Update through React store (primary source)
    if (window.setCurrentToolInStore) {
        window.setCurrentToolInStore(tool);
        return; // Store handles everything including DOM updates
    }
    
    // FALLBACK: Legacy behavior (should rarely be used)
    console.warn('[IRIS Migration] set_tool: Using legacy vars.tool.type update fallback - React store not available yet');
    get_object("tb_tool_"+vars.tool.type).classList.remove("checked");
    get_object("tb_tool_"+tool).classList.add("checked");

    vars.tool.type = tool;

    render_preview();
}

function get_tool_offset(){
    /*Since we have draw with a tool, this returns the offset of the tool sprite*/
    // Get tool size from React store (primary source) with fallback to legacy vars
    let toolSize;
    if (window.getToolSizeFromStore) {
        toolSize = window.getToolSizeFromStore();
    } else {
        console.warn('[IRIS Migration] get_tool_offset: Using legacy vars.tool.size fallback - React store not available yet');
        toolSize = vars.tool.size; // Fallback during initialization
    }
    
    if (toolSize == 1){
        return {'x': 0, 'y': 0}
    }

    return {
        'x': round_number(-toolSize/2),
        'y': round_number(-toolSize/2),
    };
}

function mouse_wheel(event){
    var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
    
    // Get resizing mode from React store (primary source) with fallback to legacy vars
    let resizingMode;
    if (window.getToolResizingModeFromStore) {
        resizingMode = window.getToolResizingModeFromStore();
    } else {
        console.warn('[IRIS Migration] mouse_wheel: Using legacy vars.tool.resizing_mode fallback - React store not available yet');
        resizingMode = vars.tool.resizing_mode; // Fallback during initialization
    }
    
    if (resizingMode){
        // Change size of tool using React store (primary source)
        let currentSize;
        if (window.getToolSizeFromStore) {
            currentSize = window.getToolSizeFromStore();
        } else {
            console.warn('[IRIS Migration] mouse_wheel: Using legacy vars.tool.size fallback - React store not available yet');
            currentSize = vars.tool.size; // Fallback during initialization
        }
        
        let newSize = currentSize + delta * 0.5 * currentSize;
        const maskShape = window.getMaskShapeFromStore ? window.getMaskShapeFromStore() : vars.mask_shape;
        if (maskShape) {
            newSize = round_number(Math.max(
                1, Math.min(
                    newSize, Math.max(...maskShape)
                )
            ));
        } else {
            console.warn('[IRIS Migration] mouse_wheel: No mask shape available, using fallback bounds');
            newSize = round_number(Math.max(1, Math.min(newSize, 100))); // Fallback to reasonable bounds
        }
        
        // Update through React store (primary source)
        if (window.segmentationStore) {
            window.segmentationStore.getState().setToolSize(newSize);
        } else {
            // Fallback to legacy vars during initialization
            console.warn('[IRIS Migration] mouse_wheel: Using legacy vars.tool.size update fallback - React store not available yet');
            vars.tool.size = newSize;
        }
        
        render_preview();
    } else {
        zoom(delta);
    }
}

function mouse_move(event){
    update_cursor_coords(this, event);
    
    // Get current tool from React store (primary source) with fallback to legacy vars
    let currentTool;
    if (window.getCurrentToolFromStore) {
        currentTool = window.getCurrentToolFromStore();
    } else {
        console.warn('[IRIS Migration] mouse_move: Using legacy vars.tool.type fallback - React store not available yet');
        currentTool = vars.tool.type; // Fallback during initialization
    }
    
    if (
        (event.buttons == 2
        || event.buttons == 4
        || (event.buttons == 1 && currentTool == 'move'))
    ){
        // Get drag start from React store (primary source) with fallback to legacy vars
        let dragStart;
        if (window.getDragStartFromStore) {
            dragStart = window.getDragStartFromStore();
        } else {
            console.warn('[IRIS Migration] mouse_move: Using legacy vars.drag_start fallback - React store not available yet');
            dragStart = vars.drag_start;
        }
        
        if (dragStart !== null) {
            // Get cursor image from React store (primary source) with fallback to legacy vars
            let cursorImage;
            if (window.getCursorImageFromStore) {
                cursorImage = window.getCursorImageFromStore();
            } else {
                console.warn('[IRIS Migration] mouse_move: Using legacy vars.cursor_image fallback - React store not available yet');
                cursorImage = vars.cursor_image; // Fallback during initialization
            }
            
            move(
                cursorImage[0]-dragStart[0],
                cursorImage[1]-dragStart[1]
            );
        }
    }

    // mouse left button must be pressed to draw
    if (event.buttons == 1 && currentTool != 'move'){
        user_draws_on_mask();
    }

    // Show a preview of the pencil:
    render_preview();
}

function mouse_down(event){
    update_cursor_coords(this, event);

    // Get current tool from React store (primary source) with fallback to legacy vars
    let currentTool;
    if (window.getCurrentToolFromStore) {
        currentTool = window.getCurrentToolFromStore();
    } else {
        console.warn('[IRIS Migration] mouse_down: Using legacy vars.tool.type fallback - React store not available yet');
        currentTool = vars.tool.type; // Fallback during initialization
    }

    if (event.buttons == 1 && currentTool != 'move'){
        user_draws_on_mask();
        
        // Clear drag start using React store (primary) with fallback to legacy vars
        if (window.setDragStartInStore) {
            window.setDragStartInStore(null);
        } else {
            console.warn('[IRIS Migration] mouse_down: Using legacy vars.drag_start fallback - React store not available yet');
            vars.drag_start = null;
        }
    } else if (
        event.buttons == 2
        || event.buttons == 4
        || (event.buttons == 1 && currentTool == 'move')
    ){
        // Get cursor image from React store (primary source) with fallback to legacy vars
        let cursorImage;
        if (window.getCursorImageFromStore) {
            cursorImage = window.getCursorImageFromStore();
        } else {
            console.warn('[IRIS Migration] mouse_down: Using legacy vars.cursor_image fallback - React store not available yet');
            cursorImage = vars.cursor_image; // Fallback during initialization
        }
        
        // Set drag start using React store (primary) with fallback to legacy vars
        if (window.setDragStartInStore) {
            window.setDragStartInStore([...cursorImage]);
        } else {
            console.warn('[IRIS Migration] mouse_down: Using legacy vars.drag_start fallback - React store not available yet');
            vars.drag_start = [...cursorImage];
        }
    }
}

function mouse_up(event){
    // Clear drag start using React store (primary) with fallback to legacy vars
    if (window.setDragStartInStore) {
        window.setDragStartInStore(null);
    } else {
        console.warn('[IRIS Migration] mouse_up: Using legacy vars.drag_start fallback - React store not available yet');
        vars.drag_start = null;
    }
}

function mouse_enter(event){
    update_cursor_coords(this, event);
    
    // Get current tool from React store (primary source) with fallback to legacy vars
    let currentTool;
    if (window.getCurrentToolFromStore) {
        currentTool = window.getCurrentToolFromStore();
    } else {
        console.warn('[IRIS Migration] mouse_enter: Using legacy vars.tool.type fallback - React store not available yet');
        currentTool = vars.tool.type; // Fallback during initialization
    }
    
    if (
        event.buttons == 2
        || event.buttons == 4
        || (event.buttons == 1 && currentTool == 'move')
    ){
        // Get cursor image from React store (primary source) with fallback to legacy vars
        let cursorImage;
        if (window.getCursorImageFromStore) {
            cursorImage = window.getCursorImageFromStore();
        } else {
            console.warn('[IRIS Migration] mouse_enter: Using legacy vars.cursor_image fallback - React store not available yet');
            cursorImage = vars.cursor_image; // Fallback during initialization
        }
        
        // Set drag start using React store (primary) with fallback to legacy vars
        if (window.setDragStartInStore) {
            window.setDragStartInStore([...cursorImage]);
        } else {
            console.warn('[IRIS Migration] mouse_enter: Using legacy vars.drag_start fallback - React store not available yet');
            vars.drag_start = [...cursorImage];
        }
    }
}

function zoom(delta){
    // PHASE 3A: For now, use legacy zoom until React components fully handle canvas transformations
    // TODO: Enable React zoom when canvas transformation is implemented in React components
    console.log('[IRIS] Using legacy zoom (React canvas transformations not yet implemented)');
    
    let factor = Math.pow(1.1, delta);

    // Get cursor image from React store (primary source) with fallback to legacy vars
    let cursorImage;
    if (window.getCursorImageFromStore) {
        cursorImage = window.getCursorImageFromStore();
    } else {
        console.warn('[IRIS Migration] zoom: Using legacy vars.cursor_image fallback - React store not available yet');
        cursorImage = vars.cursor_image; // Fallback during initialization
    }

    for (let canvas of document.getElementsByClassName('view-canvas')){
        let ctx = canvas.getContext('2d');
        // This makes sure that we zoom onto the current cursor position:
        ctx.translate(...cursorImage);
        ctx.scale(factor, factor);
        ctx.translate(-cursorImage[0], -cursorImage[1]);

        constrain_view(ctx, factor, 0, 0);
    }
    update_views();
    
    // Also update React store for consistency
    if (window.reactViewManager && window.reactViewManager.setZoom) {
        const currentZoom = window.reactViewManager.getZoom();
        const newZoom = currentZoom * factor;
        window.reactViewManager.setZoom(newZoom);
    }
    update_views();
}

function move(dx, dy){
    if (dx == 0 && dy == 0){
        return;
    }

    for (let canvas of document.getElementsByClassName('view-canvas')){
        let ctx = canvas.getContext('2d');
        ctx.translate(dx, dy);
        constrain_view(ctx, 1, dx, dy);
    }
    update_views();
}

function constrain_view(ctx, scale, dx, dy){
    let transforms = ctx.getTransform();

    // Get image shape from React store with fallback to legacy vars
    const imageShape = window.getImageShapeFromStore ? 
        window.getImageShapeFromStore() : vars.image_shape;
    
    if (!imageShape) {
        console.warn('[IRIS Migration] constrain_view: No image shape available');
        return;
    }
    
    // Warn if falling back to legacy vars
    if (!window.getImageShapeFromStore && vars.image_shape) {
        console.warn('⚠️ [IRIS Migration] constrain_view: Using legacy vars.image_shape fallback - React store not available');
    }

    if (transforms.a*scale < ctx.canvas.width / imageShape[0]){
        // We don't want to allow any zooming outside of the image area and reset
        // it to the default view

        transforms.a = ctx.canvas.width / imageShape[0];
        transforms.d = ctx.canvas.height / imageShape[1];
        transforms.b = 0;
        transforms.c = 0;
        transforms.e = 0;
        transforms.f = 0;
    }

    let top_left = ctx.getCanvasCoords(0, 0);
    if (top_left.x > 0){
        transforms.e -= top_left.x;
    }
    if (top_left.y > 0){
        transforms.f -= top_left.y;
    }

    let bottom_right = ctx.getCanvasCoords(...imageShape);
    if (bottom_right.x < ctx.canvas.width){
        transforms.e -= bottom_right.x - ctx.canvas.width;
    }
    if (bottom_right.y < ctx.canvas.height){
        transforms.f -= bottom_right.y - ctx.canvas.height;
    }

    ctx.setTransform(
        transforms.a, transforms.b, transforms.c,
        transforms.d, transforms.e, transforms.f
    );
}

function update_views(){
    /*Update all views in all canvases. Always required after a zooming or
    translation action.*/

    // PHASE 3A: For now, use legacy update until React components fully handle canvas transformations

    // Safety check: only proceed if ViewManager is initialized
    if (!vars.vm || !vars.vm.render) {
        console.log('[IRIS] update_views called but ViewManager not initialized yet');
        return;
    }

    // The coordinate system has changed:
    let one_canvas = document.getElementsByClassName("view-canvas")[0];
    if (!one_canvas) {
        console.log('[IRIS] No view canvas found, skipping update_views');
        return;
    }
    
    let ctx = one_canvas.getContext("2d");
    if (!ctx || !ctx.getWorldCoords) {
        console.log('[IRIS] Canvas context not ready, skipping update_views');
        return;
    }
    
    // Get canvas coordinates from React store (primary source)
    let canvasCoords;
    if (window.getCanvasMousePositionFromStore) {
        canvasCoords = window.getCanvasMousePositionFromStore();
    } else {
        console.warn('[IRIS Migration] update_views: Using legacy vars.cursor_canvas fallback - React store not available yet');
        canvasCoords = vars.cursor_canvas || [0, 0];
    }
    
    let image_coords = ctx.getWorldCoords(...canvasCoords);
    let newCursorImage = [image_coords.x, image_coords.y];
    
    // Update through React store (primary source)
    if (window.setCursorImageInStore) {
        window.setCursorImageInStore(newCursorImage[0], newCursorImage[1]);
    } else {
        // Fallback to legacy vars during initialization
        console.warn('[IRIS Migration] update_cursor_coords: Using legacy vars.cursor_image update fallback - React store not available yet');
        vars.cursor_image = newCursorImage;
    }

    // Redraw everything:
    vars.vm.render();
}

function reset_views(){
    // PHASE 3A: For now, use legacy reset until React components fully handle canvas transformations
    console.log('[IRIS] Using legacy reset_views (React canvas transformations not yet implemented)');
    
    // Get image shape from React store with fallback to legacy vars
    const imageShape = window.getImageShapeFromStore ? 
        window.getImageShapeFromStore() : vars.image_shape;
    
    if (!imageShape) {
        console.warn('[IRIS Migration] reset_views: No image shape available');
        return;
    }
    
    // Warn if falling back to legacy vars
    if (!window.getImageShapeFromStore && vars.image_shape) {
        console.warn('⚠️ [IRIS Migration] reset_views: Using legacy vars.image_shape fallback - React store not available');
    }
    
    for (let canvas of document.getElementsByClassName('view-canvas')){
        let ctx = canvas.getContext('2d');
        ctx.setTransform(
            ctx.canvas.width / imageShape[0], 0, 0,
            ctx.canvas.width / imageShape[0], 0, 0
        );
    }
    update_views();
    
    // Also update React store for consistency
    if (window.reactViewManager && window.reactViewManager.resetView) {
        window.reactViewManager.resetView();
    }
}

function update_cursor_coords(obj, event){
    // Update the current coords to image coordinate system:
    let rect = obj.getBoundingClientRect();
    let x = round_number(
        (event.clientX - rect.left) / (rect.right - rect.left) * obj.width
    );
    let y = round_number(
        (event.clientY - rect.top) / (rect.bottom - rect.top) * obj.height
    );

    // Update canvas coordinates through React store (primary source)
    if (window.setCanvasMousePositionInStore) {
        window.setCanvasMousePositionInStore(x, y);
    } else {
        console.warn('[IRIS Migration] update_cursor_coords: Using legacy vars.cursor_canvas fallback - React store not available yet');
        vars.cursor_canvas = [x, y];
    }

    let canvas = document.getElementsByClassName('view-canvas')[0];
    let image_coords = canvas.getContext("2d").getWorldCoords(x, y);
    let newCursorImage = [
        round_number(image_coords.x), round_number(image_coords.y)
    ];
    
    // Update through React store (primary source)
    if (window.setCursorImageInStore) {
        window.setCursorImageInStore(newCursorImage[0], newCursorImage[1]);
    } else {
        // Fallback to legacy vars during initialization
        console.warn('[IRIS Migration] update_cursor_coords: Using legacy vars.cursor_image update fallback - React store not available yet');
        vars.cursor_image = newCursorImage;
    }
}

function update_drawn_pixels(){
    // Get mask data from React store (primary source) with fallback to legacy vars
    let maskData, userMaskData;
    
    if (window.getMaskDataFromStore && window.getUserMaskDataFromStore) {
        try {
            maskData = window.getMaskDataFromStore();
            userMaskData = window.getUserMaskDataFromStore();
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store mask access failed in update_drawn_pixels:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
            maskData = vars.mask;
            userMaskData = vars.user_mask;
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available in update_drawn_pixels, using legacy vars fallback');
        maskData = vars.mask;
        userMaskData = vars.user_mask;
    }

    if (!maskData || !userMaskData) {
        console.warn('[IRIS] update_drawn_pixels: No mask data available');
        return;
    }

    vars.n_user_pixels = {
        "total": 0
    };
    for (var i=0; i < vars.classes.length; i++){
        vars.n_user_pixels[i] = 0;
    }

    for (var i=0; i<userMaskData.length; i++){
        if (userMaskData[i]){
            vars.n_user_pixels[maskData[i]] += 1;
            vars.n_user_pixels.total += 1;
        }
    }
    
    // Sync pixel counts to React store
    if (window.segmentationStore) {
        const store = window.segmentationStore.getState();
        store.updateUserPixelCounts(vars.n_user_pixels);
    }
    
    get_object("drawn-pixels").innerHTML = nice_number(vars.n_user_pixels.total);

    var different_classes = 0;
    for (var i=0; i < vars.classes.length; i++){
        if (vars.n_user_pixels[i] > 10){
            different_classes += 1;
        }
    }

    get_object("different-classes").innerHTML = different_classes;

    if (different_classes >= 2){
        get_object("ai-recommendation").innerHTML = "Start the training!";
    } else {
        get_object("ai-recommendation").innerHTML = "Draw at least 10 pixels from two classes!";
    }
}

function discard_future(){
    // Use React store as primary source with fallback to legacy vars
    if (window.discardFutureInStore) {
        try {
            window.discardFutureInStore();
            return;
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store discard future failed:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available for discard future, using legacy vars fallback');
    }

    // Fallback to legacy behavior
    // Delete everything ahead the current epoch in the history stack
    if (vars.history.current_epoch == vars.history.mask.length-1){
        return;
    }

    var start = vars.history.current_epoch+1;
    var n_elements = vars.history.mask.length - vars.history.current_epoch
    vars.history.mask.splice(start, n_elements);
    vars.history.user_mask.splice(start, n_elements);
}

function update_history(){
    // Use React store as primary source with fallback to legacy vars
    if (window.updateHistoryInStore) {
        try {
            window.updateHistoryInStore();
            return;
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store history update failed:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available for history update, using legacy vars fallback');
    }

    // Fallback to legacy behavior
    vars.history.mask.push(vars.mask.slice());
    vars.history.user_mask.push(vars.user_mask.slice());

    if (vars.history.mask.length > vars.history.max_epochs){
        // Remove the oldest timestamp
        vars.history.mask.shift();
        vars.history.user_mask.shift();
    }
    vars.history.current_epoch = vars.history.mask.length - 1;
}

function undo(){
    // Use React store as primary source with fallback to legacy vars
    if (window.undoInStore) {
        try {
            window.undoInStore();
            
            // Still need to trigger legacy rendering functions
            update_drawn_pixels();
            reload_hidden_mask();
            render_mask();
            return;
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store undo failed:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available for undo, using legacy vars fallback');
    }

    // Fallback to legacy behavior
    if (vars.history.mask.length == 0){
        // There is no history saved
        return;
    }

    vars.history.current_epoch -= 1;
    vars.history.current_epoch = Math.max(
        vars.history.current_epoch, 0
    );

    vars.mask = vars.history.mask[vars.history.current_epoch].slice();
    vars.user_mask = vars.history.user_mask[vars.history.current_epoch].slice();

    update_drawn_pixels();
    reload_hidden_mask();
    render_mask();

    // Notify React store that mask has changed
    if (window.segmentationStore) {
        const store = window.segmentationStore.getState();
        store.setMaskChanged(true);
        store.setShowDialogueBeforeNextImage(true);
    } else {
        vars.show_dialogue_before_next_image = true;
    }
}

function redo(){
    // Use React store as primary source with fallback to legacy vars
    if (window.redoInStore) {
        try {
            window.redoInStore();
            
            // Still need to trigger legacy rendering functions
            update_drawn_pixels();
            reload_hidden_mask();
            render_mask();
            return;
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store redo failed:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available for redo, using legacy vars fallback');
    }

    // Fallback to legacy behavior
    if (vars.history.mask.length == 0){
        // There is no history saved
        return;
    }

    vars.history.current_epoch += 1;
    vars.history.current_epoch = Math.min(
        vars.history.current_epoch, vars.history.mask.length-1
    );

    vars.mask = vars.history.mask[vars.history.current_epoch].slice();
    vars.user_mask = vars.history.user_mask[vars.history.current_epoch].slice();

    update_drawn_pixels();
    reload_hidden_mask();
    render_mask();

    // Notify React store that mask has changed
    if (window.segmentationStore) {
        const store = window.segmentationStore.getState();
        store.setMaskChanged(true);
        store.setShowDialogueBeforeNextImage(true);
    } else {
        vars.show_dialogue_before_next_image = true;
    }
}

// CRITICAL: Helper function for efficient mask pixel updates during drawing
function updateMaskPixels(updates) {
    /*
    Updates mask pixels efficiently using React store as primary source
    
    Args:
        updates: Array of {x, y, maskValue, userMaskValue} objects
    */
    if (!updates || updates.length === 0) return;
    
    // Use React store as primary source with fallback to legacy vars
    if (window.getMaskDataFromStore && window.getUserMaskDataFromStore && 
        window.setMaskDataInStore && window.setUserMaskDataInStore) {
        try {
            const maskData = window.getMaskDataFromStore();
            const userMaskData = window.getUserMaskDataFromStore();
            
            if (!maskData || !userMaskData || !vars.mask_shape) {
                console.warn('[IRIS Migration] ⚠️ Mask data not available, using legacy vars fallback');
                throw new Error('Mask data not available');
            }
            
            // Create copies for batch update
            const newMaskData = new Uint8Array(maskData);
            const newUserMaskData = new Uint8Array(userMaskData);
            
            // Apply all updates
            updates.forEach(({x, y, maskValue, userMaskValue}) => {
                if (x >= 0 && x < vars.mask_shape[0] && y >= 0 && y < vars.mask_shape[1]) {
                    const index = y * vars.mask_shape[0] + x;
                    if (maskValue !== undefined) {
                        newMaskData[index] = maskValue;
                    }
                    if (userMaskValue !== undefined) {
                        newUserMaskData[index] = userMaskValue;
                    }
                }
            });
            
            // Update store with new data
            window.setMaskDataInStore(newMaskData, vars.mask_shape[0], vars.mask_shape[1]);
            window.setUserMaskDataInStore(newUserMaskData);
            
            return;
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store batch mask update failed:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available for batch mask update, using legacy vars fallback');
    }
    
    // Fallback to legacy vars
    updates.forEach(({x, y, maskValue, userMaskValue}) => {
        if (x >= 0 && x < vars.mask_shape[0] && y >= 0 && y < vars.mask_shape[1]) {
            const index = y * vars.mask_shape[0] + x;
            if (maskValue !== undefined) {
                vars.mask[index] = maskValue;
            }
            if (userMaskValue !== undefined) {
                vars.user_mask[index] = userMaskValue;
            }
        }
    });
}

function user_draws_on_mask(){
    /*The user draws to the mask

    Returns:
        * list([x0, y0, xn, yn]) - bounding_box in canvas coordinates

    */

    // Just get one canvas
    let canvas = document.getElementsByClassName("view-canvas")[0];
    let ctx = canvas.getContext('2d');

    // Get image shape from React store with fallback to legacy vars
    const imageShape = window.getImageShapeFromStore ? 
        window.getImageShapeFromStore() : vars.image_shape;
    
    if (!imageShape) {
        console.warn('[IRIS Migration] user_draws_on_mask: No image shape available');
        return;
    }
    
    // Warn if falling back to legacy vars
    if (!window.getImageShapeFromStore && vars.image_shape) {
        console.warn('⚠️ [IRIS Migration] user_draws_on_mask: Using legacy vars.image_shape fallback - React store not available');
    }

    // Get the area we finally have to render (update) in canvas coordinates.
    // This increases the performances:
    let drawing_area = {
        'min_x': imageShape[0],
        'min_y': imageShape[1],
        'max_x': 0,
        'max_y': 0,
    };

    // Since the tools (like the painting brush) are centered on the cursor, all
    // tool pixels must be translated by an offset:
    let offset = get_tool_offset();

    // We go through each tool pixel (pixel where something should be drawn to)
    // and check whether it is inside the mask and canvas area. Hence, we need
    // to convert the tool pixels which are relative coordinates into mask and
    // canvas coordinates.

    // Get the bounding box mask coordinates:
    // Get tool size from React store (primary source) with fallback to legacy vars
    let toolSize;
    if (window.getToolSizeFromStore) {
        toolSize = window.getToolSizeFromStore();
    } else {
        console.warn('[IRIS Migration] user_draws_on_mask: Using legacy vars.tool.size fallback - React store not available yet');
        toolSize = vars.tool.size; // Fallback during initialization
    }
    
    // Get cursor image from React store (primary source) with fallback to legacy vars
    let cursorImage;
    if (window.getCursorImageFromStore) {
        cursorImage = window.getCursorImageFromStore();
    } else {
        console.warn('[IRIS Migration] user_draws_on_mask: Using legacy vars.cursor_image fallback - React store not available yet');
        cursorImage = vars.cursor_image; // Fallback during initialization
    }
    
    let x_start = cursorImage[0] + offset.x,
        x_end = x_start + toolSize;
    let y_start = cursorImage[1] + offset.y,
        y_end = y_start + toolSize;

    // For round brushes, we need to ensure the bounding box encompasses the full circle
    // The current bounding box is based on the square tool size, which should work for circles too
    // since the circle fits within the square, but let's make sure the center calculation is correct

    // Make sure we do not draw outside of the canvas. Hence, here we have the
    // canvas boundaries in image coordinates:
    let canvas_bounds = [
        ctx.getWorldCoords(0, 0),
        ctx.getWorldCoords(canvas.width, canvas.height)
    ];
    x_start = Math.max(round_number(canvas_bounds[0].x), x_start);
    x_end = Math.min(round_number(canvas_bounds[1].x), x_end);
    y_start = Math.max(round_number(canvas_bounds[0].y), y_start);
    y_end = Math.min(round_number(canvas_bounds[1].y), y_end);

    // Transform into mask coordinates:
    x_start -= vars.mask_area[0];
    x_end -= vars.mask_area[0];
    y_start -= vars.mask_area[1];
    y_end -= vars.mask_area[1];

    // Make sure we do not draw outside of the masking area:
    x_start = Math.max(0, x_start);
    x_end = Math.min(vars.mask_shape[0]-1, x_end);
    y_start = Math.max(0, y_start);
    y_end = Math.min(vars.mask_shape[1]-1, y_end);

    // Get current tool from React store (primary source) with fallback to legacy vars
    let currentTool;
    if (window.getCurrentToolFromStore) {
        currentTool = window.getCurrentToolFromStore();
    } else {
        console.warn('[IRIS Migration] user_draws_on_mask: Using legacy vars.tool.type fallback - React store not available yet');
        currentTool = vars.tool.type; // Fallback during initialization
    }

    // Get tool shape from React store (primary source) with fallback to legacy vars
    let toolShape;
    if (window.getToolShapeFromStore) {
        toolShape = window.getToolShapeFromStore();
    } else {
        console.warn('[IRIS Migration] user_draws_on_mask: Using legacy vars.tool.shape fallback - React store not available yet');
        toolShape = vars.tool.shape || 'square'; // Fallback during initialization
    }

    // Draw pixels based on tool shape
    if (toolShape === 'round') {
        // Special case: 1-pixel brush - square and round are identical
        if (toolSize === 1) {
            // Use simple single-pixel logic for both square and round
            const x = x_start;
            const y = y_start;
            const pixelUpdates = [];
            
            if (currentTool == "eraser"){
                pixelUpdates.push({x, y, userMaskValue: 0});
            } else {
                pixelUpdates.push({x, y, maskValue: vars.current_class, userMaskValue: 1});
            }
            
            // Apply batch update
            updateMaskPixels(pixelUpdates);
        }
        // Special case: 3-pixel brush - use cross pattern (center + 4 adjacent pixels)
        else if (toolSize === 3) {
            // Cross pattern: center pixel + 4 adjacent pixels (no corners)
            const centerX = Math.floor((x_start + x_end) / 2);
            const centerY = Math.floor((y_start + y_end) / 2);
            
            // Define cross pattern relative to center
            const crossPattern = [
                {dx: 0, dy: 0},   // center
                {dx: -1, dy: 0},  // left
                {dx: 1, dy: 0},   // right
                {dx: 0, dy: -1},  // top
                {dx: 0, dy: 1}    // bottom
            ];
            
            // Collect pixel updates for batch processing
            const pixelUpdates = [];
            for (const {dx, dy} of crossPattern) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                // Check bounds
                if (x >= x_start && x < x_end && y >= y_start && y < y_end) {
                    if (currentTool == "eraser"){
                        pixelUpdates.push({x, y, userMaskValue: 0});
                    } else {
                        pixelUpdates.push({x, y, maskValue: vars.current_class, userMaskValue: 1});
                    }
                }
            }
            
            // Apply batch update
            updateMaskPixels(pixelUpdates);
        }
        // Special case: 5-pixel brush - use diamond pattern (center + cross + diagonals at distance 1)
        else if (toolSize === 5) {
            // Diamond pattern: center + 4 adjacent + 4 diagonal neighbors
            const centerX = Math.floor((x_start + x_end) / 2);
            const centerY = Math.floor((y_start + y_end) / 2);
            
            // Define diamond pattern relative to center
            const diamondPattern = [
                {dx: 0, dy: 0},   // center
                // Cross (distance 1)
                {dx: -1, dy: 0},  // left
                {dx: 1, dy: 0},   // right
                {dx: 0, dy: -1},  // top
                {dx: 0, dy: 1},   // bottom
                // Diagonals (distance 1)
                {dx: -1, dy: -1}, // top-left
                {dx: 1, dy: -1},  // top-right
                {dx: -1, dy: 1},  // bottom-left
                {dx: 1, dy: 1},   // bottom-right
                // Extended cross (distance 2)
                {dx: -2, dy: 0},  // far left
                {dx: 2, dy: 0},   // far right
                {dx: 0, dy: -2},  // far top
                {dx: 0, dy: 2}    // far bottom
            ];
            
            for (const {dx, dy} of diamondPattern) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                // Check bounds
                if (x >= x_start && x < x_end && y >= y_start && y < y_end) {
                    // Use React store as primary source with fallback to legacy vars
                    if (window.setMaskPixelInStore && window.setUserMaskPixelInStore) {
                        try {
                            if (currentTool == "eraser"){
                                window.setUserMaskPixelInStore(x, y, 0);
                            } else {
                                const currentClass = window.getCurrentClassFromStore ? window.getCurrentClassFromStore() : vars.current_class;
                                window.setMaskPixelInStore(x, y, currentClass);
                                window.setUserMaskPixelInStore(x, y, 1);
                            }
                        } catch (error) {
                            console.error('[IRIS Migration] ❌ React store pixel update failed in diamond pattern:', error);
                            console.warn('[IRIS Migration] Using legacy vars fallback');
                            // Fallback to legacy behavior
                            if (currentTool == "eraser"){
                                vars.user_mask[y*vars.mask_shape[0]+x] = 0;
                            } else {
                                vars.mask[y*vars.mask_shape[0]+x] = vars.current_class;
                                vars.user_mask[y*vars.mask_shape[0]+x] = 1;
                            }
                        }
                    } else {
                        console.warn('[IRIS Migration] ⚠️ React store not available for diamond pattern drawing, using legacy vars fallback');
                        // Fallback to legacy behavior
                        if (currentTool == "eraser"){
                            vars.user_mask[y*vars.mask_shape[0]+x] = 0;
                        } else {
                            vars.mask[y*vars.mask_shape[0]+x] = vars.current_class;
                            vars.user_mask[y*vars.mask_shape[0]+x] = 1;
                        }
                    }
                }
            }
        }
        // Regular round brush: use circular drawing logic for sizes > 5
        else {
            // Calculate the center of the brush in image coordinates (before mask transformation)
            const brushCenterX = cursorImage[0] + offset.x + toolSize / 2;
            const brushCenterY = cursorImage[1] + offset.y + toolSize / 2;
            const radius = toolSize / 2;
            
            // Iterate through bounding box and check if each pixel is within the circle
            const pixelUpdates = [];
            for (let x = x_start; x < x_end; x++) {
                for (let y = y_start; y < y_end; y++) {
                    // Convert mask coordinates back to image coordinates for distance calculation
                    const imageX = x + vars.mask_area[0];
                    const imageY = y + vars.mask_area[1];
                    
                    // Calculate distance from brush center
                    const dx = imageX - brushCenterX;
                    const dy = imageY - brushCenterY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Only draw if pixel is within the circle
                    if (distance <= radius) {
                        if (currentTool == "eraser"){
                            pixelUpdates.push({x, y, userMaskValue: 0});
                        } else {
                            pixelUpdates.push({x, y, maskValue: vars.current_class, userMaskValue: 1});
                        }
                    }
                }
            }
            
            // Apply batch update
            updateMaskPixels(pixelUpdates);
        }
    } else {
        // Square brush: use original rectangular drawing logic
        const pixelUpdates = [];
        for (let x = x_start; x < x_end; x++) {
            for (let y = y_start; y < y_end; y++) {
                if (currentTool == "eraser"){
                    pixelUpdates.push({x, y, userMaskValue: 0});
                } else {
                    pixelUpdates.push({x, y, maskValue: vars.current_class, userMaskValue: 1});
                }
            }
        }
        
        // Apply batch update
        updateMaskPixels(pixelUpdates);
    }
    drawing_area = [x_start, y_start, x_end-x_start, y_end-y_start];

    // Now we draw on the hidden mask and render it
    if (vars.mask_type == 'final' || vars.mask_type == 'user'){
        var hidden_ctx;
        if (window.getHiddenMaskContextFromStore) {
            hidden_ctx = window.getHiddenMaskContextFromStore();
            if (!hidden_ctx) {
                console.warn('[IRIS Migration] Using legacy vars.hidden_mask fallback - context not available from store');
                hidden_ctx = vars.hidden_mask?.getContext('2d');
            }
        } else {
            console.warn('[IRIS Migration] Using legacy vars.hidden_mask fallback - store not available');
            hidden_ctx = vars.hidden_mask?.getContext('2d');
        }
        
        if (!hidden_ctx) {
            console.error('[IRIS] Hidden mask context not available');
            return;
        }
        
        if (toolShape === 'round') {
            // Special case: 1-pixel brush - square and round are identical
            if (toolSize === 1) {
                const x = x_start;
                const y = y_start;
                
                if (currentTool == "eraser" || vars.current_class == 0){
                    hidden_ctx.clearRect(x, y, 1, 1);
                } else {
                    // First clear to prevent double-application, then fill
                    hidden_ctx.clearRect(x, y, 1, 1);
                    hidden_ctx.fillStyle = rgba2css(get_current_class_colour());
                    hidden_ctx.fillRect(x, y, 1, 1);
                }
            }
            // Special case: 3-pixel brush - use cross pattern
            else if (toolSize === 3) {
                const centerX = Math.floor((x_start + x_end) / 2);
                const centerY = Math.floor((y_start + y_end) / 2);
                
                // Define cross pattern relative to center
                const crossPattern = [
                    {dx: 0, dy: 0},   // center
                    {dx: -1, dy: 0},  // left
                    {dx: 1, dy: 0},   // right
                    {dx: 0, dy: -1},  // top
                    {dx: 0, dy: 1}    // bottom
                ];
                
                for (const {dx, dy} of crossPattern) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    
                    // Check bounds
                    if (x >= x_start && x < x_end && y >= y_start && y < y_end) {
                        if (currentTool == "eraser" || vars.current_class == 0){
                            hidden_ctx.clearRect(x, y, 1, 1);
                        } else {
                            // First clear to prevent double-application, then fill
                            hidden_ctx.clearRect(x, y, 1, 1);
                            hidden_ctx.fillStyle = rgba2css(get_current_class_colour());
                            hidden_ctx.fillRect(x, y, 1, 1);
                        }
                    }
                }
            }
            // Special case: 5-pixel brush - use diamond pattern
            else if (toolSize === 5) {
                const centerX = Math.floor((x_start + x_end) / 2);
                const centerY = Math.floor((y_start + y_end) / 2);
                
                // Define diamond pattern relative to center
                const diamondPattern = [
                    {dx: 0, dy: 0},   // center
                    // Cross (distance 1)
                    {dx: -1, dy: 0},  // left
                    {dx: 1, dy: 0},   // right
                    {dx: 0, dy: -1},  // top
                    {dx: 0, dy: 1},   // bottom
                    // Diagonals (distance 1)
                    {dx: -1, dy: -1}, // top-left
                    {dx: 1, dy: -1},  // top-right
                    {dx: -1, dy: 1},  // bottom-left
                    {dx: 1, dy: 1},   // bottom-right
                    // Extended cross (distance 2)
                    {dx: -2, dy: 0},  // far left
                    {dx: 2, dy: 0},   // far right
                    {dx: 0, dy: -2},  // far top
                    {dx: 0, dy: 2}    // far bottom
                ];
                
                for (const {dx, dy} of diamondPattern) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    
                    // Check bounds
                    if (x >= x_start && x < x_end && y >= y_start && y < y_end) {
                        if (currentTool == "eraser" || vars.current_class == 0){
                            hidden_ctx.clearRect(x, y, 1, 1);
                        } else {
                            // First clear to prevent double-application, then fill
                            hidden_ctx.clearRect(x, y, 1, 1);
                            hidden_ctx.fillStyle = rgba2css(get_current_class_colour());
                            hidden_ctx.fillRect(x, y, 1, 1);
                        }
                    }
                }
            }
            // Regular round brush: use circular drawing logic for sizes > 5
            else {
                const brushCenterX = cursorImage[0] + offset.x + toolSize / 2;
                const brushCenterY = cursorImage[1] + offset.y + toolSize / 2;
                const radius = toolSize / 2;
                
                if (currentTool == "eraser"){
                    // For eraser, we need to clear pixels within the circle
                    for (let x = x_start; x < x_end; x++) {
                        for (let y = y_start; y < y_end; y++) {
                            // Convert mask coordinates back to image coordinates for distance calculation
                            const imageX = x + vars.mask_area[0];
                            const imageY = y + vars.mask_area[1];
                            
                            // Calculate distance from brush center
                            const dx = imageX - brushCenterX;
                            const dy = imageY - brushCenterY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            // Only clear if pixel is within the circle
                            if (distance <= radius) {
                                hidden_ctx.clearRect(x, y, 1, 1);
                            }
                        }
                    }
                } else {
                    // For drawing, check if we're drawing "clear" class (0) or a real class
                    if (vars.current_class == 0) {
                        // Clear class: clear pixels within the circle
                        for (let x = x_start; x < x_end; x++) {
                            for (let y = y_start; y < y_end; y++) {
                                // Convert mask coordinates back to image coordinates for distance calculation
                                const imageX = x + vars.mask_area[0];
                                const imageY = y + vars.mask_area[1];
                                
                                // Calculate distance from brush center
                                const dx = imageX - brushCenterX;
                                const dy = imageY - brushCenterY;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                // Only clear if pixel is within the circle
                                if (distance <= radius) {
                                    hidden_ctx.clearRect(x, y, 1, 1);
                                }
                            }
                        }
                    } else {
                        // Real class: first clear the circular area, then fill with class color
                        // This prevents double-application and ensures consistent opacity
                        for (let x = x_start; x < x_end; x++) {
                            for (let y = y_start; y < y_end; y++) {
                                // Convert mask coordinates back to image coordinates for distance calculation
                                const imageX = x + vars.mask_area[0];
                                const imageY = y + vars.mask_area[1];
                                
                                // Calculate distance from brush center
                                const dx = imageX - brushCenterX;
                                const dy = imageY - brushCenterY;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                // Only modify if pixel is within the circle
                                if (distance <= radius) {
                                    // First clear the pixel to prevent double-application
                                    hidden_ctx.clearRect(x, y, 1, 1);
                                    // Then fill with the class color
                                    hidden_ctx.fillStyle = rgba2css(get_current_class_colour());
                                    hidden_ctx.fillRect(x, y, 1, 1);
                                }
                            }
                        }
                    }
                }
            }
            
            render_mask(); // Full re-render for round brushes
        } else {
            // Square brush: use original rectangular drawing logic for partial updates
            hidden_ctx.clearRect(...drawing_area);

            if (currentTool != "eraser"){
                hidden_ctx.fillStyle = rgba2css(get_current_class_colour());
                hidden_ctx.fillRect(...drawing_area);
            }
            
            render_mask(drawing_area); // Optimized partial re-render for square brushes
        }
    }

    update_drawn_pixels();

    // Part of the history (undo-redo) system. When new pixels are drawn, we
    // delete all saved future elements in the history stack and add the
    // current masks to the history
    discard_future();
    update_history();

    // Set flag to show confirmation dialog before navigating away
    if (window.segmentationStore) {
        const store = window.segmentationStore.getState();
        store.setShowDialogueBeforeNextImage(true);
        // IMPORTANT: Mark mask as changed so it gets saved properly
        store.setMaskChanged(true);
    } else {
        vars.show_dialogue_before_next_image = true;
    }
}

function reload_hidden_mask(){
    /*Update hidden mask on a offscreen canvas*/
    
    // Get hidden mask context from React store or fallback to legacy
    let ctx;
    if (window.getHiddenMaskContextFromStore) {
        ctx = window.getHiddenMaskContextFromStore();
        if (!ctx) {
            console.warn('[IRIS Migration] Using legacy vars.hidden_mask fallback - context not available from store');
            // Safety check: only proceed if hidden mask canvas is initialized
            if (!vars.hidden_mask) {
                console.error('[IRIS] Hidden mask canvas not available');
                return;
            }
            ctx = vars.hidden_mask.getContext('2d');
        }
    } else {
        console.warn('[IRIS Migration] Using legacy vars.hidden_mask fallback - store not available');
        // Safety check: only proceed if hidden mask canvas is initialized
        if (!vars.hidden_mask) {
            console.error('[IRIS] Hidden mask canvas not available');
            return;
        }
        ctx = vars.hidden_mask.getContext('2d');
    }
    
    if (!ctx) {
        console.error('[IRIS] Hidden mask context not available');
        return;
    }
    
    // Safety check: ensure mask data is available
    const maskShape = window.getMaskShapeFromStore ? window.getMaskShapeFromStore() : vars.mask_shape;
    if (!maskShape || !vars.mask) {
        console.error('[IRIS] Mask data not available for reload_hidden_mask');
        return;
    }

    // Prepare the actual mask which will be drawn:
    let [mask, colours] = get_current_mask_and_colours();
    let sprite = ctx.createImageData(...maskShape);

    // We go through each pixel in the bounding box and redraw them:
    for (var y = 0; y < sprite.height; y++) {
        for (var x = 0; x < sprite.width; x++) {
            let offset = (y * sprite.width + x) * 4;
            let colour = colours[mask[y*maskShape[0]+x]];
            sprite.data[offset] = colour[0];
            sprite.data[offset + 1] = colour[1];
            sprite.data[offset + 2] = colour[2];
            sprite.data[offset + 3] = colour[3];
        }
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    //(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight):
    ctx.putImageData(sprite, 0, 0);
}

function set_mask_type(type){
    // PHASE 1: Check React store first (new source of truth)
    if (window.segmentationStore) {
        window.segmentationStore.getState().setMaskType(type);
        return; // Store handles everything including DOM updates
    }
    
    // FALLBACK: Legacy behavior (should rarely be used)
    console.log('[IRIS] Using legacy set_mask_type fallback, store not available');
    get_object("tb_mask_"+vars.mask_type).classList.remove("checked");
    get_object("tb_mask_"+type).classList.add("checked");

    vars.mask_type = type;

    reload_hidden_mask();
    render_mask();
    show_mask(true);
}

function get_current_class_colour(){
    if (vars.mask_type == "user"){
        if ("user_colour" in vars.classes[vars.current_class]){
            return vars.classes[vars.current_class].user_colour;
        } else {
            return vars.classes[vars.current_class].colour;
        }
    } else { //  if (vars.mask_type == "user"){
        return vars.classes[vars.current_class].colour;
    }
}

function get_current_mask_and_colours(){
    // Use React store as primary source with fallback to legacy vars
    let maskData, userMaskData, maskType, classes;
    
    if (window.getMaskDataFromStore && window.getUserMaskDataFromStore && 
        window.getMaskTypeFromStore && window.getClassesFromStore) {
        try {
            maskData = window.getMaskDataFromStore();
            userMaskData = window.getUserMaskDataFromStore();
            maskType = window.getMaskTypeFromStore();
            classes = window.getClassesFromStore();
            
            if (!maskData || !classes) {
                console.warn('[IRIS Migration] ⚠️ Mask data not available from React store, using legacy vars fallback');
                maskData = vars.mask;
                userMaskData = vars.user_mask;
                maskType = vars.mask_type;
                classes = vars.classes;
            }
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store mask access failed in get_current_mask_and_colours:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
            maskData = vars.mask;
            userMaskData = vars.user_mask;
            maskType = vars.mask_type;
            classes = vars.classes;
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available in get_current_mask_and_colours, using legacy vars fallback');
        maskData = vars.mask;
        userMaskData = vars.user_mask;
        maskType = vars.mask_type;
        classes = vars.classes;
    }

    if (maskType == "final"){
        var colours = [];
        for (var c of classes){
            colours.push(c.colour);
        }
        return [maskData, colours]
    } else if (maskType == "user"){
        var colours = [
            [255, 255, 255,0], // no user pixel
        ];
        for (var c of classes){
            if ("user_colour" in c){
                colours.push(c.user_colour);
            } else {
                colours.push(c.colour);
            }
        }
        var mask = new Uint8Array(maskData.length);
        for (var i=0; i<mask.length; i++){
            if (userMaskData[i]){
                mask[i] = maskData[i] + 1;
            } else {
                // User did not draw anything, so keep it transparent:
                mask[i] = 0;
            }
        }

        return [mask, colours]
    } else if (vars.mask_type == "errors"){ // error mask
        var colours = [
            [255, 255, 255,0], // no validation possible
            [0, 255, 0, 70], // correctly predicted
            [255, 70, 70, 255], // wrongly predicted
        ];
        return [vars.errors_mask, colours]
    }
}

function render_mask(bbox=null){
    /*Draw the mask onto the mask canvases.

    Args:
        bbox [x_0, y_0, x_n, y_n]: area in canvas coordinates that should
        be rendered. If given, this function only redraws this area.
        Otherwise (per default), it renders the whole mask in the current canvas
        area again.
    */

    // Safety check: only render if ViewManager is initialized
    if (!vars.vm || !vars.vm.getLayers) {
        console.log('[IRIS] render_mask called but ViewManager not initialized yet');
        return;
    }

    // Render the new mask sprite to all canvases:
    for (let layer of vars.vm.getLayers("mask")) {
        layer.render(bbox);
    }
}

function render_preview(){
    // Safety check: only render if ViewManager is initialized
    if (!vars.vm || !vars.vm.getLayers) {
        console.log('[IRIS] render_preview called but ViewManager not initialized yet');
        return;
    }
    
    for (let layer of vars.vm.getLayers("preview")) {
        layer.render();
    }
}

function reset_mask(){
    // Use React store as primary source with fallback to legacy vars
    if (window.getMaskShapeFromStore && window.setMaskDataInStore && window.setUserMaskDataInStore) {
        try {
            const maskShape = window.getMaskShapeFromStore();
            if (!maskShape) {
                console.error('[IRIS Migration] ❌ No mask shape available from React store for reset_mask');
                return;
            }
            
            // Create new empty mask arrays
            const newMaskData = new Uint8Array(maskShape[0] * maskShape[1]);
            const newUserMaskData = new Uint8Array(maskShape[0] * maskShape[1]);
            newMaskData.fill(0);
            newUserMaskData.fill(0);
            
            // Update React store with reset mask data (primary source)
            window.setMaskDataInStore(newMaskData, maskShape[0], maskShape[1]);
            window.setUserMaskDataInStore(newUserMaskData);
            
            console.log('[IRIS Migration] ✅ Reset mask using React store as primary source');
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store reset_mask failed:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
            
            // Fallback to legacy behavior
            const maskShape = vars.mask_shape;
            if (!maskShape) {
                console.error('[IRIS Migration] No mask shape available for reset_mask fallback');
                return;
            }
            
            vars.mask = new Uint8Array(maskShape[1] * maskShape[0]);
            vars.user_mask = new Uint8Array(maskShape[1] * maskShape[0]);
            vars.mask.fill(0);
            vars.user_mask.fill(0);
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available for reset_mask, using legacy vars fallback');
        
        // Fallback to legacy behavior
        const maskShape = vars.mask_shape;
        if (!maskShape) {
            console.error('[IRIS Migration] No mask shape available for reset_mask fallback');
            return;
        }
        
        vars.mask = new Uint8Array(maskShape[1] * maskShape[0]);
        vars.user_mask = new Uint8Array(maskShape[1] * maskShape[0]);
        vars.mask.fill(0);
        vars.user_mask.fill(0);
    }

    reload_hidden_mask();
    render_mask();
    update_drawn_pixels();

    // Set flag to show confirmation dialog before navigating away
    if (window.segmentationStore) {
        const store = window.segmentationStore.getState();
        store.setShowDialogueBeforeNextImage(true);
        // IMPORTANT: Mark mask as changed so it gets saved properly
        store.setMaskChanged(true);
    } else {
        vars.show_dialogue_before_next_image = true;
    }
}

function reset_filters(){
    // Use React store if available (new source of truth)
    if (window.segmentationStore) {
        window.segmentationStore.getState().resetFilters();
        return;
    }
    
    // Fallback to legacy behavior
    console.log('[IRIS] Using legacy reset filters fallback, store not available');
    
    // Safety check: only proceed if ViewManager is initialized
    if (!vars.vm || !vars.vm.filters) {
        console.log('[IRIS] ViewManager not initialized, skipping filter reset');
        return;
    }
    
    vars.vm.filters.brightness = 100;
    vars.vm.filters.saturation = 100;
    set_contrast(false);
    set_invert(false);
    vars.vm.render();
}

// TODO: how to get the action_id without sending an additional request?
// async function activate_action(activate){
//     vars.activate_action = activate;
//
//     show_message("Mask is being activated...");
//
//     action_info = {
//         "active": activate
//     }
//
//     fetch(`${vars.url.main}set_action_info/${action_id}`, {
//         method: "POST",
//         body: JSON.stringify(action_info)
//     })
//
//     if (vars.activate_action){
//         get_object("tb_activate_action").classList.add("checked");
//     } else {
//         get_object("tb_activate_action").classList.remove("checked");
//     }
//     hide_message();
// }

function show_mask(visible){
    // MIGRATION COMPLETE: Use React store as source of truth
    // The store syncs to DOM via React effect in segmentation-app.tsx
    if (window.segmentationStore) {
        window.segmentationStore.getState().setShowMask(visible);
        return; // React handles everything
    }
    
    // FALLBACK: Should never reach here if React loaded properly
    console.warn('show_mask() called but React store not available yet');
}

function login_finished(){
    fetch_server_update(update_config=true);
}

function logout_finished(){
    save_mask();
    goto_url(vars.url.segmentation+'?image_id='+vars.image_id);
}

async function fetch_server_update(update_config=true){
    let response = await fetch(vars.url.user+"get/current");
    if (response.status == 403) {
        dialogue_login();
        
        // Use React store as primary source
        if (window.setJustLoggedInInStore) {
            window.setJustLoggedInInStore(true);
        } else {
            // Fallback to legacy vars during initialization
            console.warn('[IRIS Migration] Using legacy vars.just_logged_in fallback for setting true');
            vars.just_logged_in = true;
        }
        return;
    }
    let user = await response.json();

    // Get more information about the current image:
    response = await fetch(vars.url.main+"image_info/"+vars.image_id);
    if (response.status != 404) {
        image = await response.json();

        let info_box = '<div class="info-box-top" style="position: relative;">';
        info_box += clip_string(image.id, 20);
        let masks = image.segmentation.count;
        if (image.segmentation.current_user_score !== null){
            masks -= 1;
        }

        if (masks != 0){
            let text = '1 other mask';
            if (masks > 1){
                text = masks.toString() + ' other masks';
            }

            info_box += '<span style="position: absolute; right: -12px; top: -25px; align-text: right;" class="tag">'+text+'</span>';
        }
        info_box += '</div>';
        info_box += '<div class="info-box-bottom">image</div>';
        get_object('image-info').innerHTML = info_box;
    } else {
        return;
    }

    info_box = '<div class="info-box-top" style="position: relative;">';
    info_box += nice_number(user.segmentation.score);
    if (image.segmentation.current_user_score !== null){
        let image_score = image.segmentation.current_user_score;
        let colour = "red";
        if (image_score > 85){
            colour = "green";
        } else if (image_score > 70){
            colour = "";
        }
        image_score = image_score.toString();
        if (image.segmentation.current_user_score_unverified){
            image_score += '?';
        }
        info_box += '<span style="position: absolute; right: -12px; top: -25px; align-text: right;" class="tag '+colour+'">'+image_score+'</span>';
    }
    info_box += '</div>';
    info_box += '<div class="info-box-bottom">'+clip_string(user.name, 20)+'</div>';
    get_object('user-info').innerHTML = info_box;
    vars.user = user;

    if (update_config){
        vars.config = user.config;

        vars.mask_area = vars.config.segmentation.mask_area;
        vars.image_shape = vars.config.images.shape;
        
        // Sync image shape to React store (primary source)
        if (vars.image_shape && Array.isArray(vars.image_shape) && vars.image_shape.length >= 2) {
            const [width, height] = vars.image_shape;
            if (window.setImageShapeInStore) {
                window.setImageShapeInStore(width, height);
            }
        }
        
        vars.classes = vars.config.classes;

        // Sync classes to React store after loading from config
        if (window.segmentationStore && vars.classes) {
            const store = window.segmentationStore.getState();
            store.setClasses(vars.classes);
            
            // Also set the current class if it's valid
            if (typeof vars.current_class === 'number' && vars.current_class < vars.classes.length) {
                store.setCurrentClass(vars.current_class);
            } else if (vars.classes.length > 0) {
                // Default to first class if current class is invalid
                vars.current_class = 0;
                store.setCurrentClass(0);
            }
        }

        // The size (shape) of the mask area:
        const maskWidth = vars.mask_area[2] - vars.mask_area[0];
        const maskHeight = vars.mask_area[3] - vars.mask_area[1];
        vars.mask_shape = [maskWidth, maskHeight];
        
        // Update React store with mask dimensions
        if (window.setMaskShapeInStore) {
            window.setMaskShapeInStore(maskWidth, maskHeight);
        } else {
            console.warn('[IRIS Migration] setMaskShapeInStore not available, using legacy vars.mask_shape only');
        }
    }

    if (user.admin){
        get_object('admin-button').style.display = "block";
    } else {
        get_object('admin-button').style.display = "none";
    }

    if (vars.next_action !== null){
        await vars.next_action();
        vars.next_action = null;
    }

    // Use React store as primary source for next_action
    let nextAction;
    if (window.getNextActionFromStore) {
        nextAction = window.getNextActionFromStore();
        if (nextAction !== null) {
            await nextAction();
            window.setNextActionInStore(null);
        }
    } else {
        // Fallback to legacy vars during initialization
        if (vars.next_action !== null) {
            console.warn('[IRIS Migration] Using legacy vars.next_action fallback for execution');
            await vars.next_action();
            vars.next_action = null;
        }
    }

    // Check every 15 seconds the current state on the server:
    setTimeout(fetch_server_update, 15000);
}

async function load_mask(){
    // PHASE 2: Check React store first (new source of truth)
    if (window.segmentationStore) {
        const store = window.segmentationStore.getState();
        try {
            await store.loadMaskForImage(vars.image_id);
            return; // Store handles everything
        } catch (error) {
            console.error('[IRIS] Store load_mask failed:', error);
            // Fall back to legacy behavior on error
        }
    }
    
    // FALLBACK: Legacy behavior (should rarely be used)
    console.log('[IRIS] Using legacy load_mask fallback, store not available');
    await legacyLoadMask();
}

async function legacyLoadMask(){
    show_loader("Loading masks...");

    var results = await download(
        vars.url.segmentation+"load_mask/" + vars.image_id
    );

    if (results.response.status != 200 && results.response.status != 404) {
        hide_loader();

        let error = await results.response.text();
        show_dialogue(
            "error",
            "Could not load the mask from the server!\n" + error
        );
        return;
    }

    var mask_length = vars.mask_shape[1]*vars.mask_shape[0];
    
    // Initialize mask arrays
    var maskData = new Uint8Array(mask_length);
    var userMaskData = new Uint8Array(mask_length);
    var errorsMaskData = new Uint8Array(mask_length);
    errorsMaskData.fill(0);

    if (results.response.status == 200){
        var data = results.data;
        maskData = data.slice(1, mask_length+1);
        userMaskData = data.slice(mask_length+1, 2*mask_length+1);
    } else if (results.response.status == 404) {
        // Just use the default mask
        maskData.fill(0);
        userMaskData.fill(0);
    }

    // CRITICAL: Use React store as primary source of truth
    if (window.setMaskDataInStore && window.setUserMaskDataInStore && window.setErrorsMaskDataInStore) {
        try {
            window.setMaskDataInStore(maskData, vars.mask_shape[0], vars.mask_shape[1]);
            window.setUserMaskDataInStore(userMaskData);
            window.setErrorsMaskDataInStore(errorsMaskData);
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store mask loading failed:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
            // Fallback to legacy vars
            vars.mask = maskData;
            vars.user_mask = userMaskData;
            vars.errors_mask = errorsMaskData;
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available, using legacy vars fallback');
        vars.mask = maskData;
        vars.user_mask = userMaskData;
        vars.errors_mask = errorsMaskData;
    }

    set_mask_type(vars.mask_type);
    hide_loader();
    update_drawn_pixels();

    // Part of the history (undo-redo) system. When new pixels are drawn, we
    // delete all saved future elements in the history stack and add the
    // current masks to the history
    discard_future();
    update_history();
}

async function download(url, init=null, html_object=null){
    if (init === null){
        var response = await fetch(url);
    } else {
        var response = await fetch(url, init);
    }

    if (response.status >= 400){
        if (response.status == 403) {
            dialogue_login();
        }
        return {
            "response": response,
            "data": null
        };
    }

    let header = response.headers.get("content-type");
    let data;
    if (header == "application/octet-stream"){
        const reader = response.body.getReader();
        let result = await reader.read();
        let received_bytes = 0;
        let chunks = [];

        while (!result.done) {
            const value = result.value;

            received_bytes += value.length;
            chunks.push(value);

            // get the next result
            result = await reader.read();
        }

        data = new Uint8Array(received_bytes);
        let position = 0;
        for(let chunk of chunks) {
          data.set(chunk, position); // (4.2)
          position += chunk.length;
        }
    } else {
        data = await response.json();
    }

    return {
        "response": response,
        "data": data
    };
}

async function dialogue_before_next_image(){
    // Check store first, fallback to vars during migration
    const shouldShowDialogue = window.segmentationStore 
        ? window.segmentationStore.getState().showDialogueBeforeNextImage
        : vars.show_dialogue_before_next_image;
    
    if (!shouldShowDialogue){
        return;
    }

    show_loader("Making some checks...")
    let response = await fetch(`${vars.url.main}get_action_info/${vars.image_id}/segmentation`);
    if (response.status >= 400){
        // Continue without any dialogue
        hide_loader(); // Fix: Hide the loader before continuing
        if (window.segmentationStore) {
            window.segmentationStore.getState().setShowDialogueBeforeNextImage(false);
        } else {
            vars.show_dialogue_before_next_image = false;
        }
        next_image();
        return;
    }
    var action = await response.json();
    var difficulty_labels=['very easy', 'easy', 'okay', 'difficult', 'very difficult'];

    var content = `
    <p>How difficult was it to create this mask?</p>
    <div class="slider">
        <div class="slider-value">${difficulty_labels[action.difficulty-1]}</div>
        <input
            class="slider-widget"
            id="dbni-difficulty"
            type="range" min="1" max="5"
            value="${action.difficulty}"
            oninput="let difficulty_labels=['very easy', 'easy', 'okay', 'difficult', 'very difficult']; this.previousElementSibling.innerHTML = difficulty_labels[parseInt(this.value)-1];">
    </div>
    <p>Do you have any comments about this segmentation (max. 256 characters)?</p>
    <textarea id="dbni-notes" style="width: 100%">${action.notes}</textarea>
    <p><input id="dbni-complete_action" type="checkbox" ${((action.complete) ? 'checked' : '')}> I think this mask is complete and ready for evaluation.</p>
    <p>
    <button onclick='dialogue_before_next_image_save_and_continue(${action.id});'>Save and continue</button>
    <button onclick='hide_dialogue();'>Go back to the mask</button>
    </p>
`;
    show_dialogue("info", content, true, "Before you continue...");
}

function dialogue_before_next_image_save_and_continue(action_id){
    // Clear the dialogue flag
    if (window.segmentationStore) {
        window.segmentationStore.getState().setShowDialogueBeforeNextImage(false);
    } else {
        vars.show_dialogue_before_next_image = false;
    }

    action_info = {
        "complete": get_object('dbni-complete_action').checked,
        "difficulty": parseInt(get_object('dbni-difficulty').value),
        "notes": get_object('dbni-notes').value
    }

    console.log('action',action_info.complete)

    fetch(`${vars.url.main}set_action_info/${action_id}`, {
        method: "POST",
        body: JSON.stringify(action_info)
    })

    // Check if there's a pending navigation from dropdown
    if (window.pendingNavigationImageId) {
        const imageId = window.pendingNavigationImageId;
        window.pendingNavigationImageId = null; // Clear it
        const url = `/segmentation/?image_id=${encodeURIComponent(imageId)}`;
        goto_url(url);
    } else {
        // Normal next image navigation
        next_image();
    }
}

function save_mask(call_afterwards=null){
    // PHASE 2: Check React store first (new source of truth)
    if (window.segmentationStore) {
        const store = window.segmentationStore.getState();
        store.saveCurrentMask().then(() => {
            if (call_afterwards !== null) {
                call_afterwards();
            }
        }).catch((error) => {
            console.error('[IRIS] Store save_mask failed:', error);
            // Fall back to legacy behavior on error
            legacySaveMask(call_afterwards);
        });
        return;
    }
    
    // FALLBACK: Legacy behavior (should rarely be used)
    console.log('[IRIS] Using legacy save_mask fallback, store not available');
    legacySaveMask(call_afterwards);
}

function legacySaveMask(call_afterwards=null){
    show_message('Saving mask...');
    
    // Get mask data from React store (primary source) with fallback to legacy vars
    let maskData, userMaskData;
    
    if (window.getMaskDataFromStore && window.getUserMaskDataFromStore) {
        try {
            maskData = window.getMaskDataFromStore();
            userMaskData = window.getUserMaskDataFromStore();
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store mask access failed:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
            maskData = vars.mask;
            userMaskData = vars.user_mask;
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available, using legacy vars fallback');
        maskData = vars.mask;
        userMaskData = vars.user_mask;
    }
    
    // Do not save any masks if they have not been loaded yet
    if (maskData === null || userMaskData === null){
        if(call_afterwards !== null){
          call_afterwards();
        }
        return;
    }

    // Allow saving even when n_user_pixels.total == 0 (empty masks should be saved)
    // This ensures that cleared/reset masks are properly saved to the server

    // Combine both masks together to one byte array only with padding magic
    // numbers 254 to make sure the transaction was done successfully
    const maskShape = window.getMaskShapeFromStore ? window.getMaskShapeFromStore() : vars.mask_shape;
    if (!maskShape) {
        console.error('[IRIS Migration] No mask shape available for save operation');
        if (call_afterwards !== null) {
            call_afterwards();
        }
        return;
    }
    
    var m_length = maskShape[0] * maskShape[1];
    var data = new Uint8Array(2*m_length+2);
    var padding = new Uint8Array([254]);
    data.set(padding);
    data.set(maskData, 1);
    data.set(userMaskData, m_length+1);
    data.set(padding, 2*m_length+1);

    fetch(vars.url.segmentation+"save_mask/" + vars.image_id, {
        method: "POST",
        body: data,
        headers: {
            "Content-Type": "application/octet-stream"
        }
    }).then((response) => {save_mask_finished(response, call_afterwards);});
}

async function save_mask_finished(response, call_afterwards){
    fetch_server_update();

    if (response.status === 200) {
        show_message('Mask saved', 1000);
        if(call_afterwards !== null){
          call_afterwards();
        }
    } else {
        let error = await response.text();
        show_dialogue(
            "error",
            "<p>Could not save the mask due to an internal problem!</p>" + error
        )
    }
}

async function predict_mask(){
    // PHASE 2: Check React store first (new source of truth)
    if (window.segmentationStore) {
        const store = window.segmentationStore.getState();
        try {
            await store.predictMask();
            return; // Store handles everything
        } catch (error) {
            console.error('[IRIS] Store predict_mask failed:', error);
            // Fall back to legacy behavior on error
        }
    }
    
    // FALLBACK: Legacy behavior (should rarely be used)
    console.log('[IRIS] Using legacy predict_mask fallback, store not available');
    await legacyPredictMask();
}

async function legacyPredictMask(){
    var user_classes = [];
    for (var i=0; i < vars.classes.length; i++){
        if (vars.n_user_pixels[i] > 10){
            user_classes.push(i);
        }
    }
    if (user_classes.length < 2){
        // This validation is now handled by React store, just return
        // The React store will show the modern error modal
        return;
    }

    show_loader("Prepare training data...");

    // Get mask data from React store (primary source) with fallback to legacy vars
    let maskData, userMaskData;
    
    if (window.getMaskDataFromStore && window.getUserMaskDataFromStore) {
        try {
            maskData = window.getMaskDataFromStore();
            userMaskData = window.getUserMaskDataFromStore();
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store mask access failed in legacyPredictMask:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
            maskData = vars.mask;
            userMaskData = vars.user_mask;
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available in legacyPredictMask, using legacy vars fallback');
        maskData = vars.mask;
        userMaskData = vars.user_mask;
    }

    if (!maskData || !userMaskData) {
        console.error('[IRIS] legacyPredictMask: No mask data available');
        hide_loader();
        return;
    }

    // Get all the user pixels
    let all_user_pixels = new Array();
    let all_user_labels = new Array();
    for (var i=0; i<=userMaskData.length; i++){
        // Only add the user pixel if there are enough pixels from that class:
        if (userMaskData[i] && vars.n_user_pixels[maskData[i]] > 10){
            all_user_pixels.push(i);
            all_user_labels.push(maskData[i]);
        }
    }

    // Sample training points (we do not want to train the model on all points):
    let all_indices = Array(all_user_pixels.length).fill().map((_, i) => i);
    var rng = new RNG(42);
    rng.shuffle(all_indices);

    // We need to keep track of how many pixels we already have sampled.
    // Furthermore, we keep also a ratio of pixels as testing dataset:
    let n_samples = {};
    let test_n_samples = {};
    for (let user_class of user_classes){
        // Set the current number of samples (0) and the maximum
        n_samples[user_class] = {
            "current": 0,
            "max": Math.min(
                round_number(vars.n_user_pixels[user_class]*vars.config.segmentation.ai_model.train_ratio),
                vars.config.segmentation.ai_model.max_train_pixels
            )
        };
        test_n_samples[user_class] = {
            "current": 0,
            "max": Infinity
        };
    }

    // Here we decide whether we send a pixel for training to the server or keep
    // it here as testing dataset:
    let test_indices = new Array();
    let train_user_pixels = new Array();
    let train_user_labels = new Array();
    let test_user_pixels = new Array();
    let test_user_labels = new Array();
    for (let i of all_indices){
        let class_id = all_user_labels[i];
        if (n_samples[class_id].current < n_samples[class_id].max){
            train_user_pixels.push(all_user_pixels[i]);
            train_user_labels.push(class_id);
            n_samples[class_id].current += 1;
        } else {
            test_indices.push(i);
            test_user_pixels.push(all_user_pixels[i]);
            test_user_labels.push(class_id);
            test_n_samples[class_id].current += 1;
        }
    }

    show_loader("Train AI...");
    let results = await download(
            vars.url.segmentation+"predict_mask/" + vars.image_id,
            {
                method: "POST",
                body: JSON.stringify({
                    "user_pixels": train_user_pixels,
                    "user_labels": train_user_labels
                })
            }
        );

    show_loader("Process results...");
    if (results.response.status >= 500) {
        hide_loader();
        console.log("Could not predict the mask! Code: " + results.response.status);
        show_dialogue(
            "error",
            "<p>Could not predict the mask due to a server problem!</p>"
        )
        return;
    }

    // Calculate confusion matrix and harmonic mean of accuracies:
    let cm = createArray(vars.classes.length, vars.classes.length);
    fill2DArray(cm, 0);

    vars.errors_mask = new Uint8Array(vars.mask.length);
    vars.errors_mask.fill(0);

    let tp = {};
    for (let user_class of user_classes){
        tp[user_class] = 0;
    }
    
    for (let i of test_indices){
        let mask_index = all_user_pixels[i];
        cm[all_user_labels[i]][results.data[mask_index]] += 1;
        if (all_user_labels[i] == results.data[mask_index]){
            tp[all_user_labels[i]] += 1;

            // Correct:
            vars.errors_mask[mask_index] = 1;
        } else {
            // Incorrect:
            vars.errors_mask[mask_index] = 2;
        }
    }
    let acc_prod = user_classes.length;
    let acc_sum = 0;
    for (let label of user_classes){
        let acc = tp[label] / test_n_samples[label].current;
        acc_prod *= acc;
        acc_sum += acc;
    }

    // Set the confusion matrix
    vars.confusion_matrix = cm;

    update_ai_box(acc_prod / acc_sum, cm, tp, user_classes);

    // Apply prediction results using React store (primary source) with fallback to legacy vars
    if (window.getMaskDataFromStore && window.getUserMaskDataFromStore && window.setMaskDataInStore) {
        try {
            const currentMaskData = window.getMaskDataFromStore();
            const currentUserMaskData = window.getUserMaskDataFromStore();
            
            if (currentMaskData && currentUserMaskData && vars.mask_shape) {
                const newMaskData = new Uint8Array(currentMaskData);
                
                // Only update the mask where the user did not draw to
                for (var i = 0; i < results.data.length; i++) {
                    if (!currentUserMaskData[i]){
                        newMaskData[i] = results.data[i];
                    }
                }
                
                // Update store with prediction results
                window.setMaskDataInStore(newMaskData, vars.mask_shape[0], vars.mask_shape[1]);
                console.log('[IRIS Migration] ✅ Applied prediction results using React store');
            } else {
                throw new Error('Mask data not available from store');
            }
        } catch (error) {
            console.error('[IRIS Migration] ❌ React store prediction application failed:', error);
            console.warn('[IRIS Migration] Using legacy vars fallback');
            
            // Fallback to legacy behavior
            for (var i = 0; i < results.data.length; i++) {
                // Only update the mask where the user did not draw to.
                if (!vars.user_mask[i]){
                    vars.mask[i] = results.data[i];
                }
            }
        }
    } else {
        console.warn('[IRIS Migration] ⚠️ React store not available for prediction application, using legacy vars fallback');
        
        // Fallback to legacy behavior
        for (var i = 0; i < results.data.length; i++) {
            // Only update the mask where the user did not draw to.
            if (!vars.user_mask[i]){
                vars.mask[i] = results.data[i];
            }
        }
    }
    
    reload_hidden_mask();
    render_mask();

    // Part of the history (undo-redo) system. When new pixels are drawn, we
    // delete all saved future elements in the history stack and add the
    // current masks to the history
    discard_future();
    update_history();

    hide_loader();

    vars.show_dialogue_before_next_image = true;
}



function update_ai_box(score, cm, tp, user_classes){
    get_object("ai-score").innerHTML = round_number(score*100) + "%";

    let recommendation = "Draw more training pixels!";

    let min_acc = 1;
    let worst_label = null;

    for (let label of user_classes){
        let acc = tp[label] / (vars.n_user_pixels[label]);
        if (acc < min_acc){
            min_acc = acc;
            worst_label = label;
        }
    }
    if (worst_label !== null){
        recommendation = "Could you provide more training pixels for <b>"+vars.classes[worst_label].name+"</b>?";
    }

    get_object("ai-recommendation").innerHTML = recommendation;
}
