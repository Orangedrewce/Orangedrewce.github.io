Target Audience

This application is designed for the data-driven, self-coached athlete who is serious about optimizing their performance, managing fatigue, and minimizing injury risk. The ideal user is someone who understands that progress isn't just about training harder, but training smarter.

Specifically, this program would greatly benefit:

    Intermediate to Advanced Climbers: The detailed tracking of skin condition, tendon soreness, and climbing-specific RPE makes it particularly powerful for climbers looking to push their limits on bouldering, sport, or lead climbing without succumbing to common overuse injuries.

    Strength & Conditioning Athletes: Individuals involved in weightlifting, CrossFit, or other high-intensity training will find the DOMS (Delayed Onset Muscle Soreness) and stress level tracking invaluable for managing recovery cycles and deciding when to go for a personal record versus when to focus on technique or deload.

    Athletes Prone to Overtraining or Injury: Anyone with a history of tendonitis, burnout, or recurring injuries can use this tool proactively. By correlating their subjective feelings (stress, mood, pain) with objective data (sleep duration, RPE), they can identify warning signs and adjust their training volume before an injury occurs.

    Technically-Minded Individuals: Users who appreciate seeing the "why" behind their body's state will love the analytics dashboard. They aren't just looking for a "go" or "no-go" signal; they want to see how a poor night's sleep impacts their readiness score two days later, or how consistent stress levels affect their recovery trend over a month.




ClimbSmart is a offline-first Training Readiness Tracker designed to provide athletes with deep, insights into their physical and mental state. Built with pure JavaScript and a modular architecture, this application emplores users to log daily metrics from sleep quality and stress levels to muscle soreness and session RPE to generate a data-driven training recommendation for the day ahead. 

All data is stored exclusively in the browser's localStorage, ensuring complete privacy and offline functionality.

"Da Vinci Sketch" user interface, where data entry panels appear as grayscale, hand-drawn sketches that "come to life" with full color and modern styling upon user interaction. This is complemented by a suite of powerful features, including a historical analytics dashboard with dynamic charts, a secure peer-to-peer data sync using WebRTC (PeerJS) and QR codes, and a robust data backup and CSV export system.

The core recommendation algorithm goes beyond daily inputs, incorporating historical trends for factors like sleep adaptation and injury risk to deliver a truly personalized readiness score, making ClimbSmart a tool for any athlete serious about optimizing their performance and recovery.




Below is how it works 




I. Document Head (<head>)

The head section links all external resources and sets up essential metadata for the application.

    Meta Tags:

        charset="UTF-8": Ensures proper character encoding.

        viewport: Configured for a responsive layout that works well on mobile devices (width=device-width, initial-scale=1.0). It also prevents user scaling (maximum-scale=1.0, user-scalable=no) to maintain a consistent app-like experience.

    Title: "ClimbSmart - Training Readiness Tracker".

    External Libraries (Scripts):

        Chart.js: For rendering data visualizations on the Analytics tab.

        QRCode.js: To generate QR codes for the P2P Sync feature.

        PeerJS: The core library for enabling direct peer-to-peer data connections.

        jsQR: For scanning and decoding QR codes using the device's camera.

        html2canvas: Used to create the "paper tear" visual effect by taking a screenshot of the page.

    Stylesheets:

        style.css: The main stylesheet that links to the application's CSS. (In our refactored architecture, this would be main.css).

II. Document Body (<body>)

The body contains the entire visible structure of the application, organized into global elements and a main container.
1. Global UI Elements

These elements exist outside the main container and are used for global notifications and overlays.

    Toast (#toast): A small, non-intrusive notification element that appears at the bottom of the screen to provide quick feedback (e.g., "Data saved," "Code copied").

    Loader (#loader): A full-screen overlay with a spinner that appears during asynchronous operations like saving data, preventing user interaction and indicating that a process is running.

    Modals: Several full-screen modal overlays are defined for different purposes:

        #welcomeModal: Appears on the user's first visit to introduce the application.

        #customModal: A generic confirmation dialog used for destructive actions like deleting entries.

        #validationModal: Displays a list of missing fields when the user tries to save an incomplete form.

        #helpModal: Contains a guide explaining each input field.

2. Main Application Container (.container)

This is the primary wrapper for the entire application, styled to look like a yellow legal pad.

    Header:

        <h1> (#appTitle): The main title of the application.

        Help Button (#helpBtn): A floating ? button positioned at the top right, which opens the #helpModal.

    Navigation Tabs (.nav-tabs):

        A row of four buttons (Daily Entry, Training History, Analytics, Sync) that control which content panel is visible.

        Styled to look like colorful sticky notes. The active class highlights the currently selected tab.

    Tab Content Panels: Each tab has a corresponding content div with a unique ID (#daily, #history, etc.). Only the panel with the active class is visible at any time.

        A. Daily Entry Tab (#daily): The primary data input form.

            Date Selector (.date-selector): Allows the user to select a date and load any existing data for that day.

            Dashboard (.dashboard): A grid containing the main input sections.

                Recovery Metrics (.input-section): Fields for Sleep Quality, Snooze/Wake Time, and Mood. Includes sliders and a calculated sleep duration display.

                Physical State (.input-section): Fields for Stress, DOMS, Tendons, Skin Condition, and Pre-Training Meal.

                Training History (.training-history-section): Fields for Days Since Last Session, Last Session RPE, and checkboxes for the type of activity completed.

                Session Notes: A full-width textarea for optional comments.

            Action Buttons (.button-group): Buttons to Update Recommendation, Save Entry, and Clear Data.

            Recommendation Panel (#recommendationPanel): A prominent banner that displays the calculated readiness score, optimal training volume, and injury risk, or an "Incomplete Data" message.

        B. Training History Tab (#history):

            History Navigation (.history-nav): "Previous" and "Next" buttons to navigate through weeks of data.

            History List (#historyList): A container where saved log entries are dynamically rendered by JavaScript.

            Export/Backup Sections:

                Export (.export-section): Buttons to Export to CSV and Clear All Data.

                Backup & Restore (.backup-section): An input field for backup codes and buttons to Generate Backup and Restore Backup.

        C. Analytics Tab (#analytics):

            Chart Controls (#chartControls): A set of toggle buttons dynamically generated by JavaScript to show/hide different datasets on the main chart.

            Chart Container (.chart-container): Contains the <canvas> element (#weeklyTrendChart) where Chart.js renders the readiness trends. Also includes a "No Data" message.

            Personalization Factors (.personalization-section): Two cards that display long-term historical factors (Sleep Adaptation, Injury Risk) that influence the readiness score.

        D. Sync Tab (#sync):

            A self-contained component for P2P data transfer.

            Sync Tabs: Toggles between "Send Data" and "Receive Data" modes.

            Send Panel (#sendContent): Displays a QR code, a 6-digit peer ID, and status updates for sending data.

            Receive Panel (#receiveContent): Contains an input for the peer ID and a button to launch the camera scanner UI.

            Camera UI (#cameraContainer): A hidden section containing the <video> element for QR code scanning.

    Script Inclusion:

        The final line of the <body> includes script.js, which contains the application's core logic (MultiDayTracker class).





I. High-Level Architecture

The application is built using a modern, class-based approach, encapsulated within an Immediately Invoked Function Expression (IIFE) to prevent global scope pollution.

    Main Controller: The MultiDayTracker class acts as the central hub of the application. It initializes all components, manages application state, handles user events, and orchestrates the flow of data.

    Specialized Modules: Functionality is delegated to specialized classes:

        PeerSync: Manages all real-time, peer-to-peer data synchronization.

        FluidTearEffect: A self-contained visual module that creates a dynamic paper-tearing animation.

    Initialization: The application is instantiated and attached to the window object (window.app) once the DOM is fully loaded, triggered by the DOMContentLoaded event listener.

II. Core Components & Classes
1. MultiDayTracker (The Main App Controller)

This class is the brain of the application, responsible for the entire user experience.

    Data Management & Persistence:

        All user entries are stored in the trainingData object, keyed by date (YYYY-MM-DD).

        Data is persisted in the browser's localStorage, allowing users to close and reopen the application without losing their history.

        A versioning system (dataVersion) is in place to handle data model changes and clear outdated storage if necessary.

    Optimized Auto-Save (startOptimizedAutoSave):

        To prevent data loss without excessive writes to localStorage, an intelligent auto-save system is implemented.

        It uses a combination of a hasUnsavedChanges flag (set by event listeners) and a generateFormHash() function.

        An interval (setInterval) periodically checks if the flag is set. If it is, it calculates a hash of the current form data.

        A save operation only occurs if the new hash is different from the previously saved hash, ensuring that saves only happen when data has actually changed.

        It also restores unsaved work from the previous session if the browser was closed unexpectedly.

    UI & Event Handling (setupEventListeners):

        Manages tab switching, including swipe gestures on mobile devices.

        Handles all button clicks (Save, Clear, Load Date, Export, etc.).

        Connects sliders to their corresponding number inputs using setupSlider, which includes robust validation to prevent invalid character entry.

        Manages the display and logic for all modals (Confirmation, Validation, Welcome, Help).

    Readiness Calculation & Recommendation Engine:

        Validation (validateFields): Before saving or calculating, it checks for missing fields. It contains conditional logic (e.g., RPE is only required on non-rest days) and presents a detailed validation modal if errors are found.

        Readiness Score (calculateAdvancedReadiness): This is the core algorithm. It synthesizes multiple data points (sleep, stress, DOMS, RPE, etc.) into a single readiness score from 0-10.

        Personalization Factors (calculateInjuryRiskFactor, calculateSleepFactor): The readiness score is not just based on the current day's data. It is dynamically adjusted based on historical trends, such as average sleep patterns and frequency of high tendon/muscle soreness, providing a more personalized result.

        Recommendation (generateRecommendation): Based on the final readiness score, it generates a clear, actionable training recommendation (e.g., "HIGH INTENSITY," "RECOVERY FOCUS") and an optimal training volume.

2. PeerSync (P2P Data Synchronization Module)

This class uses the PeerJS library to enable direct, secure data transfer between two devices without a central server.

    Sender Flow:

        Generates a unique 6-character, human-readable ID.

        Uses the QRCode.js library to render this ID as a scannable QR code.

        Initializes a PeerJS connection and waits for the receiver to connect.

        Upon connection, it serializes the entire trainingData object and sends it to the receiver.

    Receiver Flow:

        The user can either type the 6-character ID manually or use the device's camera to scan the QR code.

        The camera functionality is powered by navigator.mediaDevices.getUserMedia and the jsQR library, which scans the video feed for a valid code within an efficient requestAnimationFrame loop.

        Once an ID is obtained, it initiates a PeerJS connection to the sender.

        It listens for incoming data, reassembles it, and then passes the complete data object back to the MultiDayTracker to be saved.

3. FluidTearEffect (Visual Data Clearing Effect)

This is a standalone visual enhancement that provides a satisfying animation when clearing data.

    Technology: It uses the html2canvas library to take a "screenshot" of the current page.

    Process:

        When triggered, it first disables all box-shadows on the page to prevent them from being baked into the screenshot.

        It captures the page content onto an off-screen canvas.

        It then creates a new, full-screen <canvas> element that is placed on top of the entire UI.

        An animate loop, driven by requestAnimationFrame, draws two clipped portions of the screenshot onto the top canvas. These two portions are moved apart over time, creating the illusion of the page tearing in two and revealing a fresh "page" underneath.

        The actual clearCurrentEntry() function is called partway through the animation.

        Crucially, it uses a try...finally block to guarantee that page shadows are re-enabled after the animation is complete or if an error occurs.













Import Order in main.css:

Styles are imported from most general to most specific to ensure predictable overrides.

    Base & Resets: base.css

    Animations: animations.css

    Layout: layout.css

    Common Components: tabs.css, buttons.css, forms.css, sliders.css, modals.css, recommendation-panel.css

    Tab-Specific Styles: daily-tab.css, history-tab.css, analytics-tab.css, sync-tab.css

    Utilities: utilities.css

