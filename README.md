# Quiz Canvas

A reusable, local-first template for turning a question and answer options into a clean shareable image.

## Run it

Open `index.html` in a browser. No install, account, server, or API key is needed.

## Included

- Live editing for the question and 2–6 answer options
- Optional accent phrase for the reference-style highlighted text
- Optional local JPG/PNG/WebP image placed between the question and answer cards
- Aspect-ratio-safe full-image or crop-to-frame fitting, plus an image-size slider up to 220%
- Auto-fit layout that reflows the question, image, and answer cards with balanced spacing
- Manual image positioning with drag-to-move and corner resize handles in the live preview
- Automatic question-to-image spacing, a gap slider, and preset or custom image-frame ratios
- Correct-answer selection with optional colour highlighting
- Batch mode for up to 3 questions, with up to 3 images uploaded together in question order
- Separate, confirmed normal and highlighted PNG downloads for every batch question (no ZIP file)
- Story, square, and feed canvas formats
- One-, two-, or three-column answer layouts
- Ice, paper, midnight, and lilac visual themes
- Local browser autosave
- Sharp PNG export generated in the browser

The first load includes the supplied reference example. Click **Reset** to clear the question, accent, image, and option text so the template is ready for fresh copy and paste.

## Batch mode

Choose **Batch · 3 max**, paste one question block per section, and click **Load questions**. Separate blocks with a blank line:

~~~text
Q: What is the capital of India?
A: Mumbai
B: New Delhi
C: Kolkata
Correct: B

Q: Which planet is known as the Red Planet?
A: Earth
B: Venus
C: Mars
Correct: C
~~~

**Correct:** accepts a letter, option number, or the exact option text. Choose up to three images in one upload; they are assigned to Question 1, Question 2, and Question 3 in filename selection order. Each question then has two separate download buttons, and each button asks for confirmation before saving its PNG.
