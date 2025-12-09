import { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import PathListEditor from './PathListEditor';

const GeneralSection = forwardRef<any, {}>((_props, ref) => {
  const [name, setName] = useState('');
  const [port, setPort] = useState(5000);
  const [host, setHost] = useState('127.0.0.1');
  const [shape1, setShape1] = useState('');
  const [shape2, setShape2] = useState('');
  const [thumbnailsEnabled, setThumbnailsEnabled] = useState(false);
  const [thumbnailsPath, setThumbnailsPath] = useState('');
  const [metadataEnabled, setMetadataEnabled] = useState(false);
  const [metadataPath, setMetadataPath] = useState('');

  // Create a ref to access PathListEditor's getData() method
  const pathListRef = useRef<any>(null);

  const getData = () => {
    // Get path data from PathListEditor component
    const pathData = pathListRef.current?.getData();
    
    return {
      name,
      port,
      host,
      images: {
        path: pathData, // Include path from PathListEditor
        shape: [parseInt(shape1) || 0, parseInt(shape2) || 0],
        thumbnails: thumbnailsEnabled ? thumbnailsPath : false,
        metadata: metadataEnabled ? metadataPath : false,
      },
    };
  };

  const setData = (data: any) => {
    if (data.name !== undefined) {
      setName(data.name);
    }
    if (data.port !== undefined) {
      setPort(data.port);
    }
    if (data.host !== undefined) {
      setHost(data.host);
    }
    if (data.images) {
      // Set path via PathListEditor
      if (data.images.path !== undefined && pathListRef.current?.setData) {
        pathListRef.current.setData(data.images.path);
      }
      
      // Set shape
      if (data.images.shape && Array.isArray(data.images.shape)) {
        setShape1(String(data.images.shape[0] || ''));
        setShape2(String(data.images.shape[1] || ''));
      }
      
      // Set thumbnails
      if (data.images.thumbnails !== undefined) {
        if (data.images.thumbnails === false) {
          setThumbnailsEnabled(false);
          setThumbnailsPath('');
        } else {
          setThumbnailsEnabled(true);
          setThumbnailsPath(data.images.thumbnails);
        }
      }
      
      // Set metadata
      if (data.images.metadata !== undefined) {
        if (data.images.metadata === false) {
          setMetadataEnabled(false);
          setMetadataPath('');
        } else {
          setMetadataEnabled(true);
          setMetadataPath(data.images.metadata);
        }
      }
    }
  };

  useImperativeHandle(ref, () => ({
    getData,
    setData,
  }));

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
        General
      </div>
      <div className="panel" style={{ display: 'block' }}>
        <div style={{ padding: '16px' }}>
          <table style={{ width: '100%' }}>
            <tbody>
            <tr>
              <td style={{ width: '300px' }}>
                <strong>Name</strong>
                <br />
                <small style={{ color: '#666' }}>
                  Optional name for this project. Example: <code style={{ color: '#d63384' }}>cloud-segmentation</code>
                </small>
              </td>
              <td style={{ width: '300px', paddingRight: '20px' }}>
                <input
                  type="text"
                  placeholder="cloud-segmentation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%' }}
                />
                <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                  This will be used as the project identifier
                </small>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Port</strong>
                <br />
                <small style={{ color: '#666' }}>
                  Set the port on which IRIS is served. Example: <code style={{ color: '#d63384' }}>6060</code>
                </small>
              </td>
              <td style={{ paddingRight: '20px' }}>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value) || 5000)}
                  min="0"
                  max="65535"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <td>
                <strong>Host</strong>
                <br />
                <small style={{ color: '#666' }}>
                  Set the host IP address for IRIS. The default value 127.0.0.1 means IRIS will only be visible on the
                  local machine. If you want to expose IRIS publicly as a web application, we recommend setting the host
                  to 0.0.0.0 and adjusting your router or consulting with your network administrators accordingly.
                </small>
              </td>
              <td style={{ paddingRight: '20px' }}>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="127.0.0.1"
                  style={{ width: '100%' }}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>IrisImages *</h4>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <strong>Path *</strong>
                <br />
                <small style={{ color: '#666', display: 'block', marginTop: '4px', lineHeight: '1.5', textAlign: 'left' }}>
                  Provide input image paths using the placeholder <code style={{ color: '#d63384' }}>{'{id}'}</code>.
                  Use a dictionary to map single or multiple dataset identifiers or file types to their path templates.
                  <ul style={{ marginTop: '8px', paddingLeft: '18px', textAlign: 'left' }}>
                    <li style={{ marginBottom: '6px' }}>
                      <strong>Placeholder:</strong> Include <code style={{ color: '#d63384' }}>{'{id}'}</code> in
                      each path; it will be replaced by the current image id.
                    </li>
                    <li style={{ marginBottom: '6px' }}>
                      <strong>Dictionary keys:</strong> Use meaningful identifiers (e.g. <code>Sentinel2</code>)
                      as these are referenced to define Views (see Views panel).
                    </li>
                    <li style={{ marginBottom: '6px' }}>
                      <strong>Supported formats:</strong> common raster formats (png, tif, GeoTIFF, VRT) and
                      NumPy (*.npy*) arrays (HxWxC) are supported.
                    </li>
                    <li>
                      <strong>Legacy behaviour:</strong> If you provided a single string path in JSON, it will appear
                      as the <code style={{ color: '#d63384' }}>"pictures"</code> entry after loading.
                    </li>
                  </ul>
                </small>
                <div style={{ marginBottom: '12px' }}>
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      marginTop: '4px',
                      textAlign: 'left',
                    }}
                  >
                    {`"path": {
    "Sentinel1": "images/{id}/S1.tif",
    "Sentinel2": "images/S2-{id}.png"
}`}
                  </pre>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <h4 style={{ marginBottom: '12px' }}>Path</h4>
                <PathListEditor ref={pathListRef} />
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Shape *</h4>
                <small style={{ color: '#666', display: 'block', marginBottom: '12px' }}>
                  The shape of the images. Must be a list of width and height. Example:{' '}
                  <code style={{ color: '#d63384' }}>[512, 512]</code>
                </small>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ paddingRight: '20px' }}>
                <h4 style={{ marginBottom: '12px' }}>Shape</h4>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', gap: '32px', maxWidth: '400px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px' }}>
                        <strong>Width *</strong>
                      </label>
                      <input
                        type="number"
                        placeholder="512"
                        value={shape1}
                        onChange={(e) => setShape1(e.target.value)}
                        style={{ width: '100%', padding: '6px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '4px' }}>
                        <strong>Height *</strong>
                      </label>
                      <input
                        type="number"
                        placeholder="512"
                        value={shape2}
                        onChange={(e) => setShape2(e.target.value)}
                        style={{ width: '100%', padding: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ paddingRight: '20px' }}>
                <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Thumbnails</h4>
                <small style={{ color: '#666', display: 'block', marginBottom: '12px' }}>
                  Optional thumbnail files for the images. Path must contain a placeholder{' '}
                  <code style={{ color: '#d63384' }}>{'{id}'}</code>. If you cannot provide any thumbnail, just leave
                  it out or set it to <code style={{ color: '#d63384' }}>False</code>. Example:{' '}
                  <code style={{ color: '#d63384' }}>thumbnails/{'{id}'}.png</code>
                </small>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={thumbnailsEnabled}
                      onChange={(e) => setThumbnailsEnabled(e.target.checked)}
                      style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                    />
                    <span style={{ marginLeft: '8px' }}>Enable</span>
                  </label>
                </div>
                {thumbnailsEnabled && (
                  <>
                    <input
                      type="text"
                      placeholder="thumbnails/{id}.png"
                      value={thumbnailsPath}
                      onChange={(e) => setThumbnailsPath(e.target.value)}
                      style={{ width: '100%', padding: '6px', marginBottom: '4px' }}
                    />
                    <small style={{ color: '#666', display: 'block' }}>
                      Provide a thumbnail path containing {'{id}'} or disable.
                    </small>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ paddingRight: '20px' }}>
                <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Metadata</h4>
                <small style={{ color: '#666', display: 'block', marginBottom: '12px', lineHeight: '1.5' }}>
                  Optional metadata for the images. Path must contain a placeholder{' '}
                  <code style={{ color: '#d63384' }}>{'{id}'}</code>. Metadata files can be in json, yaml or another
                  text file format. json and yaml files will be parsed and made available via the GUI. If the metadata
                  contains the key <code style={{ color: '#d63384' }}>location</code> with a list of two floats
                  (longitude and latitude), it can be used for a bingmap view. If you cannot provide any metadata, just
                  leave it out or set it to <code style={{ color: '#d63384' }}>false</code>. Example field:{' '}
                  <code style={{ color: '#d63384' }}>metadata/{'{id}'}.json</code>. Example file contents:
                </small>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  {`{
  "spacecraft_id": "Sentinel2",
  "scene_id": "coast",
  "location": [-26.3981, 113.3077],
  "resolution": 20.0
}`}
                </pre>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={metadataEnabled}
                      onChange={(e) => setMetadataEnabled(e.target.checked)}
                      style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                    />
                    <span style={{ marginLeft: '8px' }}>Enable</span>
                  </label>
                </div>
                {metadataEnabled && (
                  <>
                    <input
                      type="text"
                      placeholder="metadata/{id}.json"
                      value={metadataPath}
                      onChange={(e) => setMetadataPath(e.target.value)}
                      style={{ width: '100%', padding: '6px', marginBottom: '4px' }}
                    />
                    <small style={{ color: '#666', display: 'block' }}>Optional metadata file (json/yaml).</small>
                  </>
                )}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
});

GeneralSection.displayName = 'GeneralSection';

export default GeneralSection;
