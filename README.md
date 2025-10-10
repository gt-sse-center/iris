# IRIS - Intelligently Reinforced Image Segmentation<sup>1</sup>
<sup>1</sup>Yes, it is a <a href="https://en.wikipedia.org/wiki/Backronym">backronym</a>.

<img src="preview/segmentation.png" />

Tool for manual image segmentation of satellite imagery (or images in general). It was designed to accelerate the creation of machine learning training datasets for Earth Observation. This application is a flask app which can be run locally. Special highlights:
* Support by AI (gradient boosted decision tree) when doing image segmentation
* Multiple and configurable views for multispectral imagery
* Simple setup with pip and one configuration file
* Platform independent app (runs on Linux, Windows and Mac OS)
* Multi-user support: work in a team on your dataset and merge the results

## Installation

### Prerequisites

IRIS requires Python 3.8 or higher. We recommend using [UV](https://docs.astral.sh/uv/) for Python and dependency management.

#### Install UV

**macOS and Linux:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Alternative (using pip):**
```bash
pip install uv
```

### Install IRIS

#### Quick Installation (Recommended)

1. **Clone the repository:**
```bash
# true upstream
# git clone git@github.com:ESA-PhiLab/iris.git
# pseudo-upstream for GT CSSE collaboration
git clone https://github.com/gt-sse-center/iris
cd iris
```

2. **Run the installation script:**
```bash
# This script will install UV (if needed) and set up IRIS
./install.sh
```

#### Manual Installation

1. **Clone the repository:**
```bash
git clone git@github.com:ESA-PhiLab/iris.git
cd iris
```

2. **Install IRIS using UV:**
```bash
# This will automatically create a virtual environment and install all dependencies
uv pip install -e .
```

3. **Activate the environment (if needed):**
```bash
# UV automatically manages the environment, but you can activate it manually if needed
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows
```

### Verify Installation

After installation, you can verify everything is working correctly:

```bash
# Run the installation test
python verify_installation.py

# Or try the demo directly
iris demo
```


## Usage

Once installed, you can run the demo version of IRIS

```
iris demo
```

If you run IRIS from within a test runner (for example when running pytest) or other tooling that passes its own CLI flags, you can separate IRIS-specific arguments using `--`. Everything after `--` will be treated as IRIS arguments. Example:

```
pytest ... -- demo
```

Having run the demo, you can then create a personalised config file, based on _demo/cloud-segmentation.json_. With your own config file, you can then instantiate your own custom project. <a href="https://github.com/ESA-PhiLab/iris/blob/master/docs/config.md">Here is a guide</a> on how to write your own config file.

```
iris label <your-config-file>
```

It is recommended to use a keyboard and mouse with scrollwheel for IRIS. Currently, control via trackpad is limited and awkward.

### Docker

You can also use Docker to deploy IRIS. The Docker image uses the modern pyproject.toml configuration for reliable dependency management.

```bash
# Build the image
docker build --tag iris .

# Run with port forwarding and volume mount
docker run -p 80:80 -v <dataset_path>:/dataset/ --rm -it iris label /dataset/cloud-segmentation.json
```

Note: Port forwarding is needed (here we use port 80 as an example, but the port number can be set in your IRIS config file) and the directory to your project needs to be given as a volume to docker.

### Run on Github Codespaces
To run in a [Github codespace](https://docs.github.com/en/codespaces/overview) fork this repository, then in the Github UI select `Code/Codespaces/Open in codespace`. Run `pip install -e .` and then `iris demo`. You will see a popup that there is an app on port 5000, click the link to open a new window showing Iris!


**Visit the official iris Github page:  https://github.com/ESA-PhiLab/iris**
