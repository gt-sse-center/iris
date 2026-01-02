/*Extend the layers from ViewLayer*/

class MaskLayer extends CanvasLayer{
    constructor(port, vm, view){
        super(port, vm, view, "mask");
    }
    render(bbox=null){
        let ctx = this.container.getContext("2d");
        
        // Get hidden canvas from React store or fallback to legacy
        const hiddenCanvas = window.getHiddenMaskCanvasFromStore ? 
            window.getHiddenMaskCanvasFromStore() : vars.hidden_mask;
        
        if (!hiddenCanvas) {
            console.error('[IRIS] Hidden mask canvas not available for MaskLayer render');
            return;
        }
        
        if (bbox === null){
            // No specific coordinates are given, i.e. we redraw the whole mask:
            // Get image shape from React store with fallback to legacy vars
            const imageShape = window.getImageShapeFromStore ? 
                window.getImageShapeFromStore() : vars.image_shape;
            
            if (imageShape) {
                ctx.clearRect(0, 0, ...imageShape);
            } else {
                console.warn('[IRIS Migration] MaskLayer.render: No image shape available');
                return;
            }
            
            // Get mask area from React store or fallback to legacy
            const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : vars.mask_area;
            
            if (!maskArea) {
                console.error('[IRIS] Mask area not available for MaskLayer render');
                return;
            }
            
            // Warn if falling back to legacy vars
            if (!window.getImageShapeFromStore && vars.image_shape) {
                console.warn('⚠️ [IRIS Migration] MaskLayer.render: Using legacy vars.image_shape fallback - React store not available');
            }
            
            if (!window.getMaskAreaFromStore && vars.mask_area) {
                console.warn('⚠️ [IRIS Migration] MaskLayer.render: Using legacy vars.mask_area fallback - React store not available');
            }
            
            ctx.drawImage(
                hiddenCanvas,
                maskArea[0], maskArea[1]
            );
        } else {
            // Get mask area from React store or fallback to legacy
            const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : vars.mask_area;
            
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
        const hiddenCanvas = window.getHiddenMaskCanvasFromStore ? 
            window.getHiddenMaskCanvasFromStore() : vars.hidden_mask;
        
        if (!hiddenCanvas) {
            console.error('[IRIS] Hidden mask canvas not available for SuperpixelsLayer render');
            return;
        }
        
        if (bbox === null){
            // No specific coordinates are given, i.e. we redraw the whole mask:
            // Get image shape from React store with fallback to legacy vars
            const imageShape = window.getImageShapeFromStore ? 
                window.getImageShapeFromStore() : vars.image_shape;
            
            if (imageShape) {
                ctx.clearRect(0, 0, ...imageShape);
            } else {
                console.warn('[IRIS Migration] SuperpixelsLayer.render: No image shape available');
                return;
            }
            
            // Warn if falling back to legacy vars
            if (!window.getImageShapeFromStore && vars.image_shape) {
                console.warn('⚠️ [IRIS Migration] SuperpixelsLayer.render: Using legacy vars.image_shape fallback - React store not available');
            }
            
            // Get mask area from React store or fallback to legacy
            const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : vars.mask_area;
            
            if (!maskArea) {
                console.error('[IRIS] Mask area not available for SuperpixelsLayer render');
                return;
            }
            
            if (!window.getMaskAreaFromStore && vars.mask_area) {
                console.warn('⚠️ [IRIS Migration] SuperpixelsLayer.render: Using legacy vars.mask_area fallback - React store not available');
            }
            
            ctx.drawImage(
                hiddenCanvas,
                maskArea[0], maskArea[1]
            );
        } else {
            // Get mask area from React store or fallback to legacy
            const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : vars.mask_area;
            
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
        
        // Get image shape from React store with fallback to legacy vars
        const imageShape = window.getImageShapeFromStore ? 
            window.getImageShapeFromStore() : vars.image_shape;
        
        if (imageShape) {
            ctx.clearRect(0, 0, ...imageShape);
        } else {
            console.warn('[IRIS Migration] PreviewLayer.render: No image shape available');
            return;
        }
        
        // Warn if falling back to legacy vars
        if (!window.getImageShapeFromStore && vars.image_shape) {
            console.warn('⚠️ [IRIS Migration] PreviewLayer.render: Using legacy vars.image_shape fallback - React store not available');
        }
        ctx.fillStyle = "rgba(150, 150, 150, 0.5)";
        
        // Get tool size from React store (primary source) with fallback to legacy vars
        let toolSize;
        if (window.getToolSizeFromStore) {
            toolSize = window.getToolSizeFromStore();
        } else {
            console.warn('[IRIS Migration] PreviewLayer.render: Using legacy vars.tool.size fallback - React store not available yet');
            toolSize = vars.tool.size; // Fallback during initialization
        }
        
        // Get cursor image from React store (primary source) with fallback to legacy vars
        let cursorImage;
        if (window.getCursorImageFromStore) {
            cursorImage = window.getCursorImageFromStore();
        } else {
            console.warn('[IRIS Migration] PreviewLayer.render: Using legacy vars.cursor_image fallback - React store not available yet');
            cursorImage = vars.cursor_image; // Fallback during initialization
        }
        
        // Get tool shape from React store (primary source) with fallback to legacy vars
        let toolShape;
        if (window.getToolShapeFromStore) {
            toolShape = window.getToolShapeFromStore();
        } else {
            console.warn('[IRIS Migration] PreviewLayer.render: Using legacy vars.tool.shape fallback - React store not available yet');
            toolShape = vars.tool.shape || 'square'; // Fallback during initialization
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
        if (vars.config.views.length < 2){
            ctx.lineWidth = "3";
        } else {
            ctx.lineWidth = "2";
        }

        ctx.strokeStyle = "red";
        ctx.setLineDash([5, 15]);
        const maskShape = window.getMaskShapeFromStore ? window.getMaskShapeFromStore() : vars.mask_shape;
        const maskArea = window.getMaskAreaFromStore ? window.getMaskAreaFromStore() : vars.mask_area;
        
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
