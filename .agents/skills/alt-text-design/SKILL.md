---
name: alt-text-design
description: "Write meaningful alternative text for images, charts, diagrams, and visual content. Use when creating or reviewing alt text, image descriptions, chart summaries, or any visual content that needs a text equivalent. Triggers on: alt text, image description, alternative text, screen reader, decorative image, chart description, infographic, data visualisation, complex image, meaningful alt."
---

# Alt Text Design

Write alt text that conveys the same information and purpose as the
visual content — not just what the image looks like, but what it
communicates.

## Core Principle

Alt text answers the question: if this image disappeared, what
information would be lost? That's what needs to be in the alt text.

## Decision Tree

### 1. Is the image purely decorative?
- Background textures, dividers, visual flourishes
- Images that repeat information already in adjacent text
- **Action:** use empty alt (alt="") so screen readers skip it

### 2. Is the image functional?
- A linked logo, an icon button, an image link
- **Action:** alt text describes the function, not the image
- Logo linking to homepage: alt="Company name — home"
- Search icon button: alt="Search"
- NOT alt="magnifying glass icon"

### 3. Is the image informative?
- Photos, illustrations, screenshots that add information
- **Action:** describe the information the image conveys
- Photo of a damaged product: alt="Crack running along the
  bottom edge of the screen"
- NOT alt="Photo of a phone" or alt="product-image-032.jpg"

### 4. Is the image complex?
- Charts, graphs, diagrams, infographics, maps
- **Action:** short alt text summarising the key message PLUS a
  longer description nearby (in the page text or a linked detail)
- Bar chart: alt="Bar chart showing sales growth — details below"
  followed by a text summary of the data
- NOT alt="bar chart" and not the entire data set in the alt attribute

## Writing Good Alt Text

### Be Specific
- Bad: "A group of people"
- Good: "Three team members reviewing a prototype on a whiteboard"

### Convey Purpose, Not Just Appearance
- Bad: "Red circle with a number"
- Good: "3 unread notifications"

### Match the Context
The same image needs different alt text in different contexts:
- On a recipe page: "Finished risotto in a white bowl, garnished
  with parmesan and basil"
- On a kitchenware product page: "Round white ceramic serving bowl,
  22cm diameter"

### Keep It Concise
- Aim for one sentence, two at most
- Don't start with "Image of..." or "Picture of..." — screen readers
  already announce it as an image
- For complex images: keep alt text short and provide detail elsewhere

## Specific Content Types

### Charts and Graphs
- Alt text: state the type and the key takeaway
- Provide a text summary or data table nearby
- "Line chart showing website traffic doubling between January and
  June 2026. Full data in the table below."

### Screenshots
- Describe what the screenshot shows that matters to the reader
- "Settings panel with the notifications toggle switched off"
- NOT "Screenshot of the settings page"

### Icons with Labels
- If the icon has a visible text label, the icon is decorative (alt="")
- If the icon is the only indicator, the alt text must convey the meaning

### Images of Text
- Avoid images of text wherever possible — use real text
- If unavoidable: the alt text must contain the full text in the image

## Assessment Questions

1. Does every non-decorative image have meaningful alt text?
2. Does the alt text convey purpose, not just appearance?
3. Are decorative images marked with empty alt?
4. Do complex images have both short alt text and a longer description?
5. Would someone using a screen reader get the same information as
   someone seeing the image?
