import json
from enum import Enum
from typing import Annotated, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


class IrisImages(BaseModel):
    path: Union[str, Dict[str, str]] = Field(
        ...,
        description="""The input path to the images. Can be either a string containing an existing path with the
placeholder `{id}` or a dictionary of paths with the placeholder `{id}` (see examples below). The placeholder will be replaced by the unique id of
the current image. IRIS can load standard image formats (like *png* or *tif*), theoretically all kind of files that can be opened by GDAL/rasterio
(such as *geotiff* or *vrt*) and numpy files (*npy*). The arrays inside the numpy files should have the shape HxWxC. Examples:

When you have one folder `images` containing your images in *tif* format:
```
"path": "images/{id}.tif"
```

When you have one folder `images` containing subfolders with your images in *tif* format:
```
"path": "images/{id}/image.tif"
```

When you have your data distributed over multiple files (e.g. coming from Sentinel-1 and Sentinel-2), you can use a dictionary for each file type. The keys of the dictionary are file identifiers which are important for the [views](#views) configuration.
```
"path": {
    "Sentinel1": "images/{id}/S1.tif",
    "Sentinel2": "images/{id}/S2.tif"
}
```
""",
    )
    # maybe not needed for launch, but neede dfor working, right?
    shape: List[int] = Field(
        None,
        min_length=2,
        max_length=2,
        description="The shape of the images. Must be a list of width and height. Example: `[512, 512]`",
    )
    # code accustommed to "false", not None, but that would be more complicated here. False or None?
    thumbnails: Optional[str] = Field(
        False,
        description="Optional thumbnail files for the images. Path must contain a placeholder `{id}`. If you cannot provide any thumbnail, just leave it out or set it to `False`. Example: `thumbnails/{id}.png`",
    )
    metadata: Optional[str] = Field(
        False,
        description="""Optional metadata for the images. Path must contain a placeholder `{id}`. Metadata files
can be in json, yaml or another text file format. json and yaml files will be parsed and made accessible via the GUI. If the metadata contains the
key `location` with a list of two floats (longitude and latitude), it can be used for a bingmap view. If you cannot provide any metadata, just
leave it out or set it to `false`. Example field: `metadata/{id}.json` . Example file contents:
```
{
    "spacecraft_id": "Sentinel2",
    "scene_id": "coast",
    "location": [-26.3981, 113.3077],
    "resolution": 20.0
}
```
""",
    )


# from iris/project Project._get_render_environment
_aliased_view_fns = [
    "max",
    "max",
    "mean",
    "median",
    "log",
    "exp",
    "sin",
    "cos",
    "PI",
    "edges",
    "superpixels",
]
_aliased_view_fn_description = f"""It can contain mathematical expressions, band combinations, or calls to specific numpy or skimage functions like `mean` (`np.mean`), `edges` (`skimage.sobel`) or `superpixels` (`skimage.felzenszwalb`). Aliased list: {_aliased_view_fns} ."""
_view_band_data_description = f"""`$B<band-number-in-file-1-indexed>` (simple string for image:path) or `$<file-identifier>.$B<band-number-in-file-1-indexed>` (dictionary supplied for image:path). Examples: `$B1`, `$Sentinel2.B1`. {_aliased_view_fn_description}"""


class IrisMonochromeView(BaseModel):
    description: Optional[str] = Field(
        None,
        description="""Further description which explains what the user can see in this view. Examples:
```
"views": {
  ...
  "Cirrus": {
      "description": "Cirrus and high clouds are red.",
      "type": "image",
      "data": "$Sentinel2.B11**0.8*5",
      "cmap": "jet"
  },
  "Cirrus-Edges": {
      "description": "Edges in the cirrus band",
      "type": "image",
      "data": "edges($Sentinel2.B11**0.8*5)*1.5",
      "cmap": "gray"
  },
  "Superpixels": {
      "description": "Superpixels in the panchromatic bands",
      "type": "image",
      "data": "superpixels($Sentinel2.B2+$Sentinel2.B3+$Sentinel2.B4, sigma=4, min_size=100)",
      "cmap": "jet"
  },
}
```
""",
    )
    type: Literal["image"] = Field("image")
    data: str = Field(
        ...,
        description=f"""Expression for a monochrome image built from one or more valid band arrays referenced as
{_view_band_data_description} {_aliased_view_fn_description}""",
    )
    cmap: str = Field("jet", description="Matplotlib colormap name to render monochrome image.")
    clip: Optional[
        Annotated[
            float,
            Field(
                strict=True,
                ge=0,
                le=100,
                description="""By default, bands are stretched between 0 and 1, relative to their
minimum and maximum values. By setting a value for clip, you control the percentile of pixels that are saturated at 0 and 1, which can be helpful
if there are some extreme pixel values that reduce the contrast in other parts of the image.""",
            ),
        ]
    ] = None
    vmin: Optional[
        Annotated[
            float,
            Field(
                strict=True,
                description="""If you know the precise low value you would like to clip the pixel values to, (rather than a percentile), then you can specify this with vmin (optionally used with `vmax`). This cannot be used for the same view as `clip`.""",
            ),
        ]
    ] = None
    vmax: Optional[
        Annotated[
            float,
            Field(
                strict=True,
                description="""If you know the precise high value you would like to clip the pixel values to, (rather than a percentile), then you can specify this with vmax (optionally used with `vmin`). This cannot be used for the same view as `clip`.""",
            ),
        ]
    ] = None


class IrisRGBView(BaseModel):
    description: Optional[str] = Field(
        None,
        description="""Further description which explains what the user can see in this view.  Examples:
```
"views": {
  ...
  "RGB": {
      "description": "Normal RGB image.",
      "type": "image",
      "data": ["$Sentinel2.B5", "$Sentinel2.B3", "$Sentinel2.B2"]
  },
  "Sentinel-1": {
      "description": "RGB of VH, VV and VH-VV.",
      "type": "image",
      "data": ["$Sentinel1.B1", "$Sentinel1.B2", "$Sentinel1.B1-$Sentinel1.B2"]
  },
}
```
""",
    )
    type: Literal["image"] = Field("image")
    data: List[str] = Field(
        ...,
        min_length=3,
        max_length=3,
        description="""Expression for the three tracks for an RGB image built from one or more valid band arrays referenced as {_view_band_dat    a_description} {_aliased_view_fn_description}""",
    )
    # cmap invalid
    clip: Optional[
        Annotated[
            float,
            Field(
                strict=True,
                ge=0,
                le=100,
                description="""By default, bands are stretched between 0 and 1, relative to
their minimum and maximum values. By setting a value for clip, you control the percentile of pixels that are saturated at 0 and 1, which can be
helpful if there are some extreme pixel values that reduce the contrast in other parts of the image.""",
            ),
        ]
    ] = None
    vmin: Optional[
        Annotated[
            float,
            Field(
                strict=True,
                description="""If you know the precise low value you would like to clip the pixel values to, (rather than a percentile), then you can specify this with vmin (optionally used with `vmax`). This cannot be used for the same view as `clip`.""",
            ),
        ]
    ] = None
    vmax: Optional[
        Annotated[
            float,
            Field(
                strict=True,
                description="""If you know the precise high value you would like to clip the pixel values to,
(rather than a percentile), then you can specify this with vmax (optionally used with `vmin`). This cannot be used for the same view as `clip`.""",
            ),
        ]
    ] = None


class IrisBingView(BaseModel):
    description: Optional[str] = Field(
        None,
        description="""Further description which explains what the user can see in this view.  Examples:
"views": {
  ...
  "Bing": {
      "description": "Aerial Imagery",
      "type": "bingmap"
  }
}
```
""",
    )
    type: Literal["bingmap"] = Field("bingmap")
    # data, cmap, clip, vmin, vmax invalid


class IrisSegClass(BaseModel):
    name: str = Field(..., description="Name of the class.")
    description: Optional[str] = Field(
        None,
        description="Further description which explains the user more about the class (e.g. why is it different from another class, etc.)",
    )
    #    colour: RGBA = Field(..., description="Colour for this class. Must be a list of 4 integers (RGBA) from 0 to 255.")
    #    user_colour: Optional[RGBA] = Field(None, description="Colour for this class when user mask is activated in the interface. Useful for background classes which are normally transparent.")

    model_config = ConfigDict(arbitrary_types_allowed=True)


class SegMaskEnum(str, Enum):
    """Allowed encodings for final masks. Not all mask formats support all encodings."""

    integer = "integer"
    binary = "binary"
    rgb = "rgb"
    rgba = "rgba"


class SegScoreEnum(str, Enum):
    """Allowed score measure."""

    f1 = "f1"
    jaccard = "jaccard"
    accuracy = "accuracy"


# after checking config is the right place for this class, fill in descriptions TODO
class IrisSegAIModel(BaseModel):
    bands: None
    train_ratio: float = Field(0.8)
    max_train_pixels: int = Field(20000)
    n_estimators: int = Field(20)
    max_depth: int = Field(10)
    n_leaves: int = Field(10)
    suppression_threshold: int = Field(0)
    suppression_filter_size: int = Field(5)
    suppression_default_class: int = Field(0)
    use_edge_filter: bool = Field(False)
    use_superpixels: bool = Field(False)
    use_meshgrid: bool = Field(False)
    meshgrid_cells: str = Field("3x3")


## segmentation
class IrisSegmentationConfig(BaseModel):
    path: str = Field(
        ...,
        description="""This directory will contain the mask files from the segmentation. Four different mask formats are
allowed: *npy*, *tif*, *png* or *jpeg*. Example:

This will create a folder next to the project file called `masks` containing the mask files in *png* format.
```
"path": "masks/{id}.png"
```
""",
    )
    mask_encoding: SegMaskEnum = Field(
        "rgb",
        description="""The encodings of the final masks. Can be `integer`, `binary`, `rgb` or `rgba`. Note:
not all mask formats support all encodings. Example: `"mask_encoding": "rgb"`.""",
    )
    mask_area: Optional[List[int]] = Field(
        None,
        min_length=4,
        max_length=4,
        description="""In case you don't want to allow the user to label the complete image, you can
limit the segmentation area. Example: `"mask_area": [100, 100, 400, 400]`""",
    )
    score: SegScoreEnum = Field(
        "f1",
        description="""Defines how to measure the score achieved by the user for each mask. Can be `f1`, `jaccard`
or `accuracy`. Example: `"score": "f1"`.""",
    )
    prioritise_unmarked_images: bool = Field(
        True,
        description="""Mode to serve up images with the lowest number of annotations when user asks for
next image.""",
    )
    unverified_threshold: int = Field(
        1,
        ge=0,
        description="""TODO Number of unverified users contributing masks above which to tag an image
"unverified".""",
    )
    # Unused? "test_images": null,
    ai_model: IrisSegAIModel


class IrisConfig(BaseModel):
    # creator: str = Field(..., description="The creator of the object.")
    # version: Optional[str] = Field(None, description="The version of the creator.")
    # routine: Optional[str] = Field(None, description="The routine of the creator.")

    # LAB: docs say optional for name, but I question this
    name: str = Field(..., description="Optional name for this project. (e.g., `cloud-segmentation`)")
    port: Annotated[
        int,
        Field(5000, strict=True, ge=0, le=65535, description="Set the port on which IRIS is served. Example: `6060`."),
    ]
    host: str = Field(
        "127.0.0.1",
        description="Set the host IP address for IRIS. The default value 127.0.0.1 means IRIS will only be visible on the local machine. If you want to expose IRIS publicly as a web application, we recommend setting the host to 0.0.0.0 and adjusting your router / consulting with your network administrators accordingly.",
        json_schema_extra={"examples": ["127.0.0.1", "0.0.0.0"]},
    )
    images: IrisImages = Field(
        ...,
        description="""A dictionary which defines the inputs. Example:
```
"images": {
      "path": "images/{id}/image.tif",
      "shape": [512, 512],
      "thumbnails": "images/{id}/thumbnail.png",
      "metadata": "images/{id}/metadata.json"
  }
```
""",
    )
    classes: List[IrisSegClass] = Field(
        ...,
        min_length=1,
        description="""This is a list of classes that you want to allow the user to label.
Examples:

    {
        "name": "Clear",
        "description": "All clear pixels.",
        "colour": [255,255,255,0],
        "user_colour": [0,255,255,70]
    },
    {
        "name": "Cloud",
        "description": "All cloudy pixels.",
        "colour": [255,255,0,70]
    }
]
""",
    )
    views: Dict[str, Union[IrisMonochromeView | IrisRGBView | IrisBingView]] = Field(
        ...,
        min_length=1,
        description="""Since this app was developed for
multi-spectral satellite data (i.e. images with more than just three channels), you can decide how to present the images to the user. This
option must be a dictionary where each key is the name of the view and the value another dictionary containing properties for the view.""",
    )
    view_groups: Dict[str, List[str]] = Field(
        ...,
        description="""Views are displayed in groups. In the GUI of IRIS, you will be able to switch
between different groups quickly. The group `default` must always be set, further groups are optional. Examples:
```
"view_groups": {
      "default": ["Cirrus", "RGB", "Bing"],
      "clouds": ["Cirrus"],
      "radar": ["Sentinel1"]
  }
```
""",
    )
    segmentation: IrisSegmentationConfig = Field(
        ..., description="""Define the parameters for the segmentation mode."""
    )


json_schema = IrisConfig.model_json_schema()
print(json.dumps(json_schema, indent=2))


# To use IRIS, you need to define a project file in JSON or YAML format. A full-working example can be found [here](../demo/cloud-segmentation.json). The following will outline each of the fields one can use to change the behaviour of IRIS. If fields are not explicitly given in a project's configuration file, then they will take the values found in the [default configuration file](../iris/default_config.json).
