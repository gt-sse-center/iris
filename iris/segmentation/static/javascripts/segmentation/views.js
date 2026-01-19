/*Extend the layers from ViewLayer*/

class MaskLayer extends CanvasLayer{
    constructor(port, vm, view){
        super(port, vm, view, "mask");
    }
    render(bbox=null){
        let ctx = this.container.getContext("2d");
        
        // Get hidden canvas from React store or fallback to legacy
        const hiddenCanvas = window.getHiddenMaskCanvasFromStore ? window.getHiddenMaskCanvasFromStore() : null;
        
        if (!hiddenCanvas) {
            console.error('[IRIS] Hidden mask canvas not available for MaskLayer render');
            return;
        }
        
        if (bbox === null){
            // No specific coordinates are given, i.e. we redraw the whole mask:
            // Get image shape from React store with fallback to legacy vars
            const imageShape = window.getImageShapeFromStore ? window.getImageShapeFromStore() : null;
            
            if (imageShape) {
                ctx.clearRect(0, 0, ...imageShape);
            } else {
                console.warn('[IRIS Migration] MaskLayer.render: No image shape available');
                return;
            }
            
            // Get mask area from React store or fallback to legacy
            const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : null;
            
            if (!maskArea) {
                console.error('[IRIS] Mask area not available for MaskLayer render');
                return;
            }
            
            // Store-based mask rendering
            
            ctx.drawImage(
                hiddenCanvas,
                maskArea[0], maskArea[1]
            );
        } else {
            // Get mask area from React store or fallback to legacy
            const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : null;
            
            if (!maskArea) {
                console.error('[IRIS] Mask area not available for MaskLayer render');
                return;
            }
            
            ctx.clearRect(
                bbox[0]+maskArea[0],
                bbox[1]+maskArea[1],
                bbox[2], bbox[3]
            );
            ctx.drawImage(
                hiddenCanvas,
                ...bbox,
                bbox[0]+maskArea[0], bbox[1]+maskArea[1],
                bbox[2], bbox[3]
            );
        }
    }
}

class SuperpixelsLayer extends CanvasLayer{
    // Shows
    //
    //
    //
    constructor(port, vm, view){
        super(port, vm, view, "superpixels");
    }
    render(bbox=null){
        let ctx = this.container.getContext("2d");
        
        // Get hidden canvas from React store or fallback to legacy
        const hiddenCanvas = window.getHiddenMaskCanvasFromStore ? window.getHiddenMaskCanvasFromStore() : null;
        
        if (!hiddenCanvas) {
            console.error('[IRIS] Hidden mask canvas not available for SuperpixelsLayer render');
            return;
        }
        
        if (bbox === null){
            // No specific coordinates are given, i.e. we redraw the whole mask:
            // Get image shape from React store with fallback to legacy vars
            const imageShape = window.getImageShapeFromStore();
            
            if (!imageShape) {
                console.error('[IRIS] ❌ No image shape available for SuperpixelsLayer.render');
                return;
            }
            
            ctx.clearRect(0, 0, ...imageShape);
            
            // Get mask area from React store (ONLY source)
            const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : null;
            
            if (!maskArea) {
                console.error('[IRIS] ❌ Mask area not available for SuperpixelsLayer render');
                return;
            }
            
            ctx.drawImage(
                hiddenCanvas,
                maskArea[0], maskArea[1]
            );
        } else {
            // Get mask area from React store or fallback to legacy
            const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : null;
            
            if (!maskArea) {
                console.error('[IRIS] Mask area not available for SuperpixelsLayer render');
                return;
            }
            
            ctx.clearRect(
                bbox[0]+maskArea[0],
                bbox[1]+maskArea[1],
                bbox[2], bbox[3]
            );
            ctx.drawImage(
                hiddenCanvas,
                ...bbox,
                bbox[0]+maskArea[0], bbox[1]+maskArea[1],
                bbox[2], bbox[3]
            );
        }
    }
}

class PreviewLayer extends CanvasLayer{
    constructor(port, vm, view){
        super(port, vm, view, "preview");

        this.container.addEventListener("mousemove", mouse_move, false);
        this.container.addEventListener("mousedown", mouse_down, false);
        this.container.addEventListener("mouseup", mouse_up, false);
        this.container.addEventListener("mouseenter", mouse_enter, false);
        this.container.addEventListener("mousewheel", mouse_wheel, false);
        this.container.addEventListener("DOMMouseScroll", mouse_wheel, false);
    }
    render(){
        let offset = get_tool_offset();

        let ctx = this.container.getContext("2d");
        
        // Get image shape from React store (ONLY source)
        const imageShape = window.getImageShapeFromStore();
        
        if (!imageShape) {
            console.error('[IRIS] ❌ No image shape available for PreviewLayer.render');
            return;
        }
        
        ctx.clearRect(0, 0, ...imageShape);
        ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
        
        // Get tool size from React store (ONLY source)
        const toolSize = window.getToolSizeFromStore ? window.getToolSizeFromStore() : 1;
        
        if (!window.getToolSizeFromStore) {
            console.error('[IRIS] ❌ Tool size not available from store');
        }
        
        // Get cursor image from React store (ONLY source)
        const cursorImage = window.getCursorImageFromStore ? window.getCursorImageFromStore() : [0, 0];
        
        if (!window.getCursorImageFromStore) {
            console.error('[IRIS] ❌ Cursor image not available from store');
        }
        
        // Get tool shape from React store (ONLY source)
        const toolShape = window.getToolShapeFromStore ? window.getToolShapeFromStore() : 'square';
        
        if (!window.getToolShapeFromStore) {
            console.error('[IRIS] ❌ Tool shape not available from store');
        }
        
        // Draw tool cursor preview based on shape
        if (toolShape === 'round') {
            // Draw circular cursor
            const radius = toolSize / 2;
            const centerX = cursorImage[0] + offset.x + radius;
            const centerY = cursorImage[1] + offset.y + radius;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // Draw square cursor (default)
            ctx.fillRect(
                cursorImage[0]+offset.x,
                cursorImage[1]+offset.y,
                toolSize, toolSize
            );
        }

        // Draw the boundaries of the masking area
        ctx.beginPath();
        
        // Primary source: React store, fallback: legacy vars
        const views = window.getConfigSectionFromStore ? window.getConfigSectionFromStore('views') : (() => {
            console.warn('[IRIS Migration] ⚠️ FALLBACK: Using legacy vars.config.views for line width - React store not available');
            return vars.config.views;
        })();
        
        const viewCount = views ? (Array.isArray(views) ? views.length : Object.keys(views).length) : 0;
        if (viewCount < 2){
            ctx.lineWidth = "3";
        } else {
            ctx.lineWidth = "2";
        }

        ctx.strokeStyle = "red";
        ctx.setLineDash([5, 15]);
        const maskShape = window.getMaskShapeFromStore ? window.getMaskShapeFromStore() : vars.mask_shape;
        const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : null;
        
        if (maskShape && maskArea) {
            ctx.rect(
                maskArea[0], maskArea[1],
                ...maskShape
            );
            ctx.stroke();
        } else {
            console.warn('[IRIS Migration] No mask shape or mask area available for ViewLayer rendering');
        }
    }
}
