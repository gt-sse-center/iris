import React, { useState, useEffect } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Hotkeys data - hardcoded from original template
const HOTKEYS: Record<string, string> = {
  '1..9': 'Select class',
  'A': 'Train AI assistant',
  'S': 'Save mask',
  'Enter': 'Next image',
  'U': 'Undo',
  'E': 'Eraser',
  'D': 'Draw tool',
  'W': 'Move tool',
  'V': 'Change view',
  'F': 'Final mask',
  'G': 'User mask',
  'Space': 'Toggle mask visibility',
  'Shift+Scroll': 'Change brush size',
};

/**
 * Help Modal Component
 * 
 * Provides comprehensive help documentation for IRIS with tabbed interface:
 * - Welcome: Introduction, basic overview, getting started guide
 * - FAQs: Frequently asked questions organized by topic
 * - Hotkeys: Keyboard shortcuts reference
 * - About: Credits and project information
 */
const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'welcome' | 'faqs' | 'hotkeys' | 'about'>('welcome');
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

  // Disable keyboard shortcuts when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalKeyDownHandler = document.body.onkeydown;
      const originalKeyUpHandler = document.body.onkeyup;
      
      document.body.onkeydown = (event: KeyboardEvent) => {
        if (event.code === 'Escape') {
          onClose();
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      };
      
      document.body.onkeyup = null;
      
      return () => {
        document.body.onkeydown = originalKeyDownHandler;
        document.body.onkeyup = originalKeyUpHandler;
      };
    }
  }, [isOpen, onClose]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (!isOpen) return null;

  return (
    <div id="dialogue" className="dialogue" style={{ display: 'block' }} data-testid="help-modal">
      <div className="dialogue-content">
        <div className="dialogue-header">
          <span className="dialogue-close" onClick={onClose}>
            &times;
          </span>
          <h2>Help</h2>
        </div>
        <div className="dialogue-body">
          {/* Tab Navigation */}
          <div className="tab">
            <button
              className={`tablinks ${activeTab === 'welcome' ? 'checked' : ''}`}
              onClick={() => setActiveTab('welcome')}
              data-testid="tab-welcome"
            >
              Welcome
            </button>
            <button
              className={`tablinks ${activeTab === 'faqs' ? 'checked' : ''}`}
              onClick={() => setActiveTab('faqs')}
              data-testid="tab-faqs"
            >
              FAQs
            </button>
            <button
              className={`tablinks ${activeTab === 'hotkeys' ? 'checked' : ''}`}
              onClick={() => setActiveTab('hotkeys')}
              data-testid="tab-hotkeys"
            >
              Hotkeys
            </button>
            <button
              className={`tablinks ${activeTab === 'about' ? 'checked' : ''}`}
              onClick={() => setActiveTab('about')}
              data-testid="tab-about"
            >
              About
            </button>
          </div>

          {/* Welcome Tab */}
          {activeTab === 'welcome' && (
            <div className="iris-tabs-help tabcontent" style={{ display: 'block' }}>
              <h3>
                Welcome to <a href="https://github.com/esa-philab/IRIS" target="_blank" rel="noopener noreferrer">IRIS</a>, 
                a labelling tool for satellite imagery and datacubes!
              </h3>

              <p>
                If you're new here, please take a moment to read this page. It will introduce you to some 
                of the basic functionality of IRIS. If you ever want to return to this page later simply 
                click <b>help</b> <button className="icon_button"><img src="/segmentation/static/icons/help.png" height="15" width="15" alt="help" /></button>
                at the top-right of the IRIS interface. We recommend that you read through the following step-by-step, and go check out and explore what is described as you go along. 
                As you do that, the <b>Hotkeys</b> tab above may be a useful companion.
              </p>

              <h3>Basic Overview</h3>

              <p>The IRIS interface consists of three main parts, starting from the top of the screen:</p>

              <ul>
                <li><b>The Toolbar:</b> Contains all the tools for drawing and editing masks, as well as manipulating and moving around the image</li>
                <li><b>The Views:</b> A set of visualisations of the data to be labelled</li>
                <li><b>The Info Panel:</b> An area where useful information about the project and your labelling work is displayed</li>
              </ul>

              <p>
                As an annotator in IRIS, your job is to create a <i>segmentation mask</i> for the images you are shown. Painting all those pixels could take you a lot of time, but luckily you 
                get to work alongside an <i>AI assistant</i>, which tries to predict the classes of areas which you haven't labelled yourself. You will be iteratively
                labelling areas in the image with the different classes you find (what those classes are depends on the project your working on, but you can find a list of them by pressing the 
                <button className="icon_button"><img src="/segmentation/static/icons/class.png" height="15" width="15" alt="class" /></button> 
                button in the toolbar). The AI assistant (a Random Forest model) will then try to predict the classes of areas which you haven't labelled yourself. You can then correct areas
                that it gets wrong, and see if it improves when you retrain the model. You can find some tips and best practices for interacting with the AI assistant in the FAQs.
              </p>

              <p>
                In your project, you may find multiple images displayed side by side (known as <i>views</i>). This is because IRIS can label data that are not just the standard red-green-blue images we are used to,
                but also images with multiple different bands. These could be different spectral channels (e.g. Infrared), or different information entirely, like maps, elevation data, or 
                anything else that you can put on a 2D surface. The creators of a project can define as many views as they like, using those different data sources. IRIS gives you the ability to switch between the
                different pre-defined views, and create whole groups of views that you can switch between easily.
              </p>

              <p>
                After you get to annotating, the mask that you and your AI assistant create will be displayed as an overlay on top of the image. This is so that you can simultaneously see your labels and what they correspond
                to in the data below. Each class will have been assigned a colour by your project administrator. One detail of IRIS that is useful to keep in mind is that there are different versions of the mask available to 
                visualise:
              </p>

              <ul>
                <li>
                  <b>The final mask<button className="icon_button"><img src="/segmentation/static/icons/mask_final.png" height="15" width="15" alt="final mask" /></button>:</b> shows a combination of your annotations and model predictions. This is the view that corresponds to the final saved mask, when you complete your work. Your annotations are always favoured against the model.
                </li>
                <li>
                  <b>The user mask <button className="icon_button"><img src="/segmentation/static/icons/mask_user.png" height="15" width="15" alt="user mask" /></button>:</b> shows only the pixels you have manually annotated. A project will often define one class to be invisible in the final mask (as a way of symbolising some kind of background class), but you should still be able to see the manual labels
                  that you've drawn of that class in the user mask view. This can be useful for checking where you've already annotated, and when erasing annotations.
                </li>
                <li>
                  <b>The error mask<button className="icon_button"><img src="/segmentation/static/icons/mask_errors.png" height="15" width="15" alt="error mask" /></button>:</b> shows the pixels that the 
                  model has predicted correctly (in green) and incorrectly (in red) for the pixels that are used for validating the models (this view does not include pixels that the model was trained on). This is a useful
                  way to see where the model is making mistakes, and where you should focus your labelling efforts.
                </li>
              </ul>

              <br />
              <h2>Getting Started</h2>

              <p>In the following, a typical workflow for a user will be described. Feel free to go sequentially through the points and try them for yourself.</p>

              <h4>1. Look around!</h4>
              <p>
                Use the zoom <span className='key'>Scrollwheel</span> and navigation<span className='key'>W</span> tools to take a closer look at the data in front of you. Is it too dark? Too bright? You can use the brightness, saturation and contrast controls located in the toolbar to help you!
              </p>

              <h4>2. Change the view</h4>
              <p>
                Select a few different views with the <span className='key'>V</span> key and see what they look like. There might be information that's useful which you can't see in the views you are
                initially given! Have a think about the features you can see in the different views, and how they might be useful for labelling. Try using the image adjustment tools mentioned in the previous step too, to make the views as clear as possible.
              </p>

              <h4>3. Select a class</h4>
              <p>
                Now that you've had a look around, you've probably noticed a few things you'd like to start labelling. Select a class from the list of classes in the toolbar. You can also use the <span className='key'>1..9</span> keys.
              </p>

              <h4>4. Start painting!</h4>
              <p>
                Using the draw tool, and adjusting the paintbrush size with <span className='key'>Shift+scrollwheel</span>, try painting a few pixels from two or three different classes. Keep it simple, just a few is fine! The classes 
                you draw will be highlighted in different colours. 
              </p>
              
              <h4>5. Display the mask</h4>
              <p>
                IRIS's mask comes from a combination of hand-drawn labels, and AI-generated predictions. When you begin annotating an image, these will be blank, but when they are populated they are displayed as a semi-transparent overlay above 
                the image views. You can view either the combined predictions between human and model, known as the final mask <button className="icon_button"><img src="/segmentation/static/icons/mask_final.png" height="15" width="15" alt="final mask" /></button>/<span className='key'>F</span>,
                or only the annotations you've made, known as the user mask <button className="icon_button"><img src="/segmentation/static/icons/mask_user.png" height="15" width="15" alt="user mask" /></button>/<span className='key'>G</span>. 
                Try selecting the user mask mode before you begin annotating.
              </p>

              <h4>5. Train your AI assistant</h4>
              <p>
                Now that you've labelled a few pixels, you can train your AI assistant. Click the <button className="icon_button"><img src="/segmentation/static/icons/ai.png" height="15" width="15" alt="AI" /></button>/<span className='key'>A</span>
                button in the toolbar, and see what happens! You can use the tools from Step 5 to display the AI predictions, and the spacebar to toggle the mask transparency, allowing you to see the image below easily.
              </p>

              <h4>6. Correct your AI assistant</h4>
              <p>
                Using all the navigation, visualisation, and labelling skills you've just practiced, go ahead and make a few corrections to what the AI predicted. It probably made some mistakes in areas of the image that are 
                different to the areas you originally labelled. That's fine! You can just keep retraining and correcting your AI assistant as you go!
              </p>

              <h4>7. Save your work</h4>
              <p>
                When you're done, don't forget to save your work! You can do this by clicking the <button className="icon_button"><img src="/segmentation/static/icons/save_mask.png" height="15" width="15" alt="save" /></button>/<span className='key'>S</span>
                button in the toolbar. You can then come back and finish the image any time you like. Or, you can move on to the next image in the project by clicking the <button className="icon_button"><img src="/segmentation/static/icons/next.png" height="15" width="15" alt="next" /></button>/<span className='key'>Enter</span>
                button.
              </p>

              <br /><br />
              <h2>Think like a robot</h2>
              <p>
                You and your AI assistant will be more effective as a team if you keep in mind it's strengths and weaknesses. Here are some tips and tricks to get the best out of your new colleague.
              </p>
              
              <h4>1. Input → Output</h4>
              <p>
                The model only learns from what you give it, so diverse labels will help the model learn about all the different areas in the image, don't just stick to annotating one area of the image, or correcting one kind of mistake.
                Quality over quantity is preferred, as errors in the labels can confuse the model. What you put in is what you get out!
              </p>

              <p>
                Something else to keep in mind is that each pixel in the image that you label is a training example for the model. This means that the model doesn't understand <i>spatial</i> relationships between pixels. This means if there
                are classes which strongly depend on textural information, it may be difficult for the model to perform well (unless the project administrator has somehow embedded this spatial information in each pixel). In the Preferences menu
                <button className="icon_button"><img src="/segmentation/static/icons/preferences.png" height="15" width="15" alt="preferences" /></button>, you can add a post-processing step which filters out small areas with
                different classes. This effectively smooths your output spatially, and may help if you have lots of noisy model errors that are difficult to correct manually.
              </p>

              <h4>2. Listening Skills</h4>
              
              <p>
                Your AI assistant might suggest a class to annotate more of in the right-hand side box of the Information Panel, this can be a useful tip to follow if you're not sure what to do. It gives this advice based on its assessment of how it
                is performing in the different classes. However, if a class is inherently more difficult than others, it will keep asking for annotations even when they are not necessarily helpful, so take what it says onboard but don't feel you need to follow it.
              </p>

              <p>
                An accuracy score and confusion matrix can also be found in the Information Panel (once the model is trained). This gives you an idea of how well the model is performing, on a set of pixels held out from training. This doesn't necessarily indicate
                its performance in areas you haven't annotated: we can't know that. However, it can give you some measure of the model's success. If you think its struggling and has
                a low accuracy, you can also try changing the model parameters in the Preferences menu <button className="icon_button"><img src="/segmentation/static/icons/preferences.png" height="15" width="15" alt="preferences" /></button>. Low accuracy
                isn't necessarily a bad thing, and you will usually find the accuracy <i>decreasing</i> over time, because you are adding more and more difficult labels.
              </p>

              <p>For more tips and advanced use suggestions, check out the FAQs.</p>
            </div>
          )}

          {/* FAQs Tab */}
          {activeTab === 'faqs' && (
            <div className="iris-tabs-help tabcontent" style={{ display: 'block' }}>
              <br />
              <h2>Annotating Images</h2>
              
              <button 
                className={`accordion ${openAccordions.has('painting') ? 'checked' : ''}`}
                onClick={() => toggleAccordion('painting')}
              >
                I'm painting pixels, but nothing's happening!
              </button>
              <div className="panel" style={{ display: openAccordions.has('painting') ? 'block' : 'none' }}>
                <p>
                  In some projects (including, for example, IRIS' demo) there is a class that is in some sense the background or default, which one does not want to visualise with a coloured overlay. For example, in the case of cloud masking with satellite imagery, pixels
                  for which we can clearly see the surface, and for which no cloud is present, it is much easier to visualise as a clear colour. Upon loading, IRIS defaults to showing you an overlay of the <i>final mask</i> which may use no colour for one of the classes. However,
                  you can switch to the <i>user mask</i> by pressing <button className="icon_button"><img src="/segmentation/static/icons/mask_user.png" height="15" width="15" alt="user mask" /></button><b>/</b><span className="key">G</span>. In the <i>user mask</i>, 
                  one should be able to see more clearly where annotations by the user have been made.
                </p>
                <p>
                  If there is still nothing showing, then make sure you are using the <i>draw tool</i> <button className="icon_button"><img src="/segmentation/static/icons/pencil.png" height="15" width="15" alt="draw" /></button><b>/</b><span className="key">D</span>, and
                  that your mask is is set to be visible <button className="icon_button"><img src="/segmentation/static/icons/show_mask.png" height="15" width="15" alt="show mask" /></button><b>/</b><span className="key">Space</span>
                </p>
              </div>

              <button 
                className={`accordion ${openAccordions.has('pencil-size') ? 'checked' : ''}`}
                onClick={() => toggleAccordion('pencil-size')}
              >
                How can I change the size of the pencil?
              </button>
              <div className="panel" style={{ display: openAccordions.has('pencil-size') ? 'block' : 'none' }}>
                <p>Press <span className="key">Shift</span> while scrolling the mouse wheel.</p>
              </div>

              <button 
                className={`accordion ${openAccordions.has('undo') ? 'checked' : ''}`}
                onClick={() => toggleAccordion('undo')}
              >
                I would like to undo some changes. How can I do that?
              </button>
              <div className="panel" style={{ display: openAccordions.has('undo') ? 'block' : 'none' }}>
                <p>
                  Use either the undo <button className="icon_button"><img src="/segmentation/static/icons/undo.png" height="15" width="15" alt="undo" /></button><b>/</b><span className="key">U</span> command or the eraser <button className="icon_button"><img src="/segmentation/static/icons/eraser.png" height="15" width="15" alt="eraser" /></button>/<span className="key">E</span>.
                </p>
              </div>

              <button 
                className={`accordion ${openAccordions.has('select-class') ? 'checked' : ''}`}
                onClick={() => toggleAccordion('select-class')}
              >
                How can I select another class for drawing?
              </button>
              <div className="panel" style={{ display: openAccordions.has('select-class') ? 'block' : 'none' }}>
                <p>
                  Use either the number hotkeys (<span className="key">1..9</span>) or click <button className="icon_button"><img src="/segmentation/static/icons/class.png" height="15" width="15" alt="class" /></button> in the toolbar.
                </p>
              </div>

              <br /><br />
              <h2>Saving and Loading</h2>

              <button 
                className={`accordion ${openAccordions.has('save-progress') ? 'checked' : ''}`}
                onClick={() => toggleAccordion('save-progress')}
              >
                Does IRIS save my progress when I leave?
              </button>
              <div className="panel" style={{ display: openAccordions.has('save-progress') ? 'block' : 'none' }}>
                <p>It is possible to lose your progress whilst annotating in IRIS, if you navigate away from the page or close the browser without doing one of the following:</p>
                <ul>
                  <li>Clicking save <button className="icon_button"><img src="/segmentation/static/icons/save_mask.png" height="15" width="15" alt="save" /></button> at the top-left of the IRIS interface. This will allow you to come back to the same image and mask later, as if you had never stopped working on it.</li>
                  <li>Going to the next or previous image.</li>
                </ul>
              </div>

              <button 
                className={`accordion ${openAccordions.has('image-order') ? 'checked' : ''}`}
                onClick={() => toggleAccordion('image-order')}
              >
                How are images ordered?
              </button>
              <div className="panel" style={{ display: openAccordions.has('image-order') ? 'block' : 'none' }}>
                <p>The IRIS project can be set up with two different image ordering modes:</p>
                <ul>
                  <li><b>Random:</b> Images are shown in a random order, with the order fixed for each different user (meaning you will always find images in the same order when you come back).</li>
                  <li><b>Prioritise least annotated:</b> Images that are the least annotated are prioritised, so that you are shown images which need more annotations. This can change the order of images dynamically.</li>
                </ul>
                <p>The project administrator can change the image ordering mode on the server by editing the project's configuration files, this cannot be altered by a user.</p>
              </div>

              <button 
                className={`accordion ${openAccordions.has('questionnaire') ? 'checked' : ''}`}
                onClick={() => toggleAccordion('questionnaire')}
              >
                What is the questionnaire that appears after I have finished an image?
              </button>
              <div className="panel" style={{ display: openAccordions.has('questionnaire') ? 'block' : 'none' }}>
                <p>
                  The short questionnaire offers you an opportunity to make any notes about the image. This may be useful at a later point for quality control or organisation. The difficulty bar is a useful way to qualitatively rate
                  how you think the labelling went. Checking the box to say that your mask is complete will mark that image as complete for you, and you will not be shown that image again (although if you exhaust all available images 
                  then the completed ones may be shown to you again). If you do not check the box, then IRIS will keep track of the fact that you would still like to work on this image later.
                </p>
              </div>

              <br />
              <h2>Interacting with the AI</h2>

              <button 
                className={`accordion ${openAccordions.has('ai-not-learning') ? 'checked' : ''}`}
                onClick={() => toggleAccordion('ai-not-learning')}
              >
                The AI doesn't seem to be learning what I want it to learn
              </button>
              <div className="panel" style={{ display: openAccordions.has('ai-not-learning') ? 'block' : 'none' }}>
                <p>
                  The AI Assistant in IRIS can be a powerful tool when used correctly. There are several ways one can help the AI model to perform better, however, it will always have limitations in certain situations
                  which may have to be resolved through manual intervention, rather than using the model's predictions. Some of the ways to help the AI are:
                </p>
                <ul>
                  <li>
                    <b>Providing high quality labels</b> helps the model by guiding it in its learning process. If the model is struggling to learn over a specific kind of area in the image, try to provide examples
                    from those areas. Counterintuitively, more training data is not always better. Try to provide the model with a diverse set of pixels, rather than a large number of pixels from the same class and the same
                    colour/type of pixel in the image.
                  </li>
                  <li>
                    <b>Altering the model parameters</b> can have a big effect on the model's performance. When training data are too few, an overly large model can overfit and produce strange outputs. Meanwhile, if 
                    many difficult and diverse labels are given, then the model may struggle to learn the complex relationships between input and output if it is too small. These parameters can be adjusted from the Preferences
                    menu in the top-right of the IRIS interface (the cog icon)<button className="icon_button"><img src="/segmentation/static/icons/preferences.png" height="15" width="15" alt="preferences" /></button>.
                  </li>
                  <li>
                    <b>Changing the bands</b> used by the model can stop the model from overfitting to input data that is not particularly relevant to the annotations of that image. Like the model's parameters, the bands can be included
                    and excluded in the Preferences menu.
                  </li>
                  <li>
                    <b>Post-processing the results</b> with the <i>suppression filter</i> can remove the small (a few pixels wide) areas that the AI assistant picks up. This can be useful to make the mask appear more smooth. However,
                    it should be used with caution, if those small regions are important for the dataset's application.
                  </li>
                </ul>
              </div>

              <button 
                className={`accordion ${openAccordions.has('more-pixels') ? 'checked' : ''}`}
                onClick={() => toggleAccordion('more-pixels')}
              >
                The information panel keeps telling me to provide more pixels of a certain class
              </button>
              <div className="panel" style={{ display: openAccordions.has('more-pixels') ? 'block' : 'none' }}>
                <p>
                  The AI assistant computes a confusion matrix using a percentage of the labels you provide, to see how well it is doing in matching your annotations. If the model is struggling with a specific class, then it will prompt 
                  you to label more of it. However, what often happens is that the class it desires more labels from is just the most difficult class to label in the image. In this case, the tooltip will continue to ask for more of that
                  class indefinitely, even if a large number of labels is provided. Don't worry if this happens, the AI assistant is never quite satisfied with what you give it, or its own performance!
                </p>
              </div>

              <button 
                className={`accordion ${openAccordions.has('accuracy-decreasing') ? 'checked' : ''}`}
                onClick={() => toggleAccordion('accuracy-decreasing')}
              >
                I keep labelling more pixels, but the accuracy displayed in the information panel is decreasing!
              </button>
              <div className="panel" style={{ display: openAccordions.has('accuracy-decreasing') ? 'block' : 'none' }}>
                <p>
                  This is perfectly natural. If you are selecting areas to label based on mistakes the model is making, then you are continuously creating a harder and harder set of pixels for the model to learn from and validate itself
                  with. If anything, a model performance of close to 100% should be more concerning than a lower one, as it may be overfitting to the training data.
                </p>
              </div>
            </div>
          )}

          {/* Hotkeys Tab */}
          {activeTab === 'hotkeys' && (
            <div className="iris-tabs-help tabcontent" style={{ display: 'block' }}>
              <table className="striped">
                <thead>
                  <tr>
                    <th><b>Command</b></th>
                    <th><b>Key</b></th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(HOTKEYS).map(([key, description]) => (
                    <tr key={key}>
                      <td>{description}</td>
                      <td><span className='key'>{key}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="iris-tabs-help tabcontent" style={{ display: 'block' }}>
              <p>IRIS was developed by</p>
              <p>John Mrziglod, Φ-lab, European Space Agency</p>
              <p>Alistair Francis, Φ-lab, European Space Agency</p>
              <hr />
              <p>
                Find more information on{' '}
                <a href="https://github.com/ESA-PhiLab/iris" target="_blank" rel="noopener noreferrer">
                  https://github.com/ESA-PhiLab/iris
                </a>
              </p>
            </div>
          )}

          {/* Close Button */}
          <p>
            <button onClick={onClose} data-testid="close-help-button">
              Close
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
