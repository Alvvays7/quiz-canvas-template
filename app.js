(function () {
  "use strict";

  const STORAGE_KEY = "quiz-canvas-template-v1";
  const THEMES = {
    ice: { accent: "#155ee8", card: "#eff7ff", correct: "#18a66a" },
    paper: { accent: "#bc5a30", card: "#fffaf0", correct: "#23835c" },
    midnight: { accent: "#77a9ff", card: "#1c2848", correct: "#61d39a" },
    lilac: { accent: "#6742d8", card: "#faf8ff", correct: "#2e9f72" }
  };
  const FORMATS = {
    portrait: { width: 1080, height: 1920 },
    square: { width: 1080, height: 1080 },
    feed: { width: 1080, height: 1350 }
  };

  const defaultState = {
    question: "What is 84 ÷ 7 + 9?",
    accent: "84 ÷ 7",
    options: ["21", "24", "20", "5"],
    format: "portrait",
    columns: 2,
    questionSize: 100,
    theme: "ice",
    accentColor: THEMES.ice.accent,
    cardColor: THEMES.ice.card,
    correctColor: THEMES.ice.correct,
    correctIndex: 0,
    highlightCorrect: true,
    imageData: "",
    imageName: "",
    imageWidth: 0,
    imageHeight: 0,
    imageFit: "contain",
    imageScale: 100,
    imageRatio: "original",
    ratioWidth: 1,
    ratioHeight: 1,
    imageGap: 2,
    autoFit: true,
    imagePositionX: 50,
    imagePositionY: 0,
    imageFrameWidth: 0
  };

  const blankState = Object.assign(clone(defaultState), {
    question: "",
    accent: "",
    options: ["", "", ""],
    columns: 1,
    correctIndex: -1,
    highlightCorrect: false,
    imageData: "",
    imageName: "",
    imageWidth: 0,
    imageHeight: 0,
    imageFit: "contain",
    imageScale: 100,
    imageRatio: "original",
    ratioWidth: 1,
    ratioHeight: 1,
    imageGap: 2,
    autoFit: true,
    imagePositionX: 50,
    imagePositionY: 0,
    imageFrameWidth: 0
  });

  let state = loadState();
  let saveTimer;
  let toastTimer;
  let imageInteraction;

  const elements = {
    question: document.getElementById("questionInput"),
    accent: document.getElementById("accentInput"),
    imageInput: document.getElementById("imageInput"),
    imagePrompt: document.getElementById("imagePrompt"),
    imageSelected: document.getElementById("imageSelected"),
    imageThumb: document.getElementById("imageThumb"),
    imageFileName: document.getElementById("imageFileName"),
    removeImage: document.getElementById("removeImageButton"),
    imageControls: document.getElementById("imageControls"),
    imageFit: document.getElementById("imageFitInput"),
    imageRatio: document.getElementById("imageRatioInput"),
    customRatio: document.getElementById("customRatioControls"),
    ratioWidth: document.getElementById("ratioWidthInput"),
    ratioHeight: document.getElementById("ratioHeightInput"),
    autoFit: document.getElementById("autoFitInput"),
    imageInteractionHint: document.getElementById("imageInteractionHint"),
    imageScale: document.getElementById("imageScaleInput"),
    imageScaleValue: document.getElementById("imageScaleValue"),
    imageGap: document.getElementById("imageGapInput"),
    imageGapValue: document.getElementById("imageGapValue"),
    options: document.getElementById("optionsList"),
    optionCount: document.getElementById("optionCount"),
    addOption: document.getElementById("addOptionButton"),
    highlightCorrect: document.getElementById("highlightCorrectInput"),
    reset: document.getElementById("resetButton"),
    canvas: document.getElementById("canvas"),
    canvasQuestion: document.getElementById("canvasQuestion"),
    canvasImageWrap: document.getElementById("canvasImageWrap"),
    canvasImage: document.getElementById("canvasImage"),
    cardsGrid: document.getElementById("cardsGrid"),
    columns: document.getElementById("columnsInput"),
    questionSize: document.getElementById("questionSizeInput"),
    questionSizeValue: document.getElementById("questionSizeValue"),
    accentColor: document.getElementById("accentColorInput"),
    cardColor: document.getElementById("cardColorInput"),
    correctColor: document.getElementById("correctColorInput"),
    previewSize: document.getElementById("previewSize"),
    saveStatus: document.getElementById("saveStatus"),
    download: document.getElementById("downloadButton"),
    toast: document.getElementById("toast")
  };

  elements.question.addEventListener("input", function (event) {
    state.question = event.target.value;
    render();
  });
  elements.accent.addEventListener("input", function (event) {
    state.accent = event.target.value;
    render();
  });
  elements.imageInput.addEventListener("change", handleImageSelection);
  elements.removeImage.addEventListener("click", removeSelectedImage);
  elements.imageFit.addEventListener("change", function (event) {
    state.imageFit = event.target.value;
    render();
  });
  elements.imageRatio.addEventListener("change", function (event) {
    state.imageRatio = event.target.value;
    render();
  });
  elements.ratioWidth.addEventListener("input", function (event) {
    state.ratioWidth = Math.max(0.2, Number(event.target.value) || 1);
    render();
  });
  elements.ratioHeight.addEventListener("input", function (event) {
    state.ratioHeight = Math.max(0.2, Number(event.target.value) || 1);
    render();
  });
  elements.autoFit.addEventListener("change", function (event) {
    const wasAutoFit = state.autoFit;
    if (event.target.checked) {
      state.autoFit = true;
      state.imagePositionX = 50;
      state.imagePositionY = 0;
      state.imageFrameWidth = 0;
      render();
      if (!wasAutoFit) showToast("Auto-fit layout restored.");
      return;
    }
    const layout = state.imageData ? getCurrentImageLayout(true) : null;
    state.autoFit = false;
    if (layout) {
      state.imagePositionX = layout.centerX;
      state.imagePositionY = layout.topPercent;
      state.imageFrameWidth = layout.widthPercent;
    }
    render();
    showToast("Manual image layout enabled.");
  });
  elements.imageScale.addEventListener("input", function (event) {
    state.imageScale = Number(event.target.value);
    if (!state.autoFit) state.imageFrameWidth = clamp(state.imageScale * 0.5, 20, 86);
    render();
  });
  elements.imageGap.addEventListener("input", function (event) {
    state.imageGap = Number(event.target.value);
    render();
  });
  elements.highlightCorrect.addEventListener("change", function (event) {
    state.highlightCorrect = event.target.checked;
    render();
  });
  elements.columns.addEventListener("change", function (event) {
    state.columns = Number(event.target.value);
    render();
  });
  elements.questionSize.addEventListener("input", function (event) {
    state.questionSize = Number(event.target.value);
    render();
  });
  elements.accentColor.addEventListener("input", function (event) {
    state.accentColor = event.target.value;
    render();
  });
  elements.cardColor.addEventListener("input", function (event) {
    state.cardColor = event.target.value;
    render();
  });
  elements.correctColor.addEventListener("input", function (event) {
    state.correctColor = event.target.value;
    render();
  });
  elements.canvasImage.addEventListener("load", function () {
    if (!state.imageData || (state.imageWidth && state.imageHeight)) return;
    state.imageWidth = elements.canvasImage.naturalWidth;
    state.imageHeight = elements.canvasImage.naturalHeight;
    render();
  });
  elements.canvasImageWrap.addEventListener("pointerdown", function (event) {
    const resizeHandle = event.target.closest ? event.target.closest(".resize-handle") : null;
    beginImageInteraction(event, resizeHandle ? resizeHandle.dataset.resize : "drag");
  });
  elements.canvasImageWrap.addEventListener("pointermove", handleImagePointerMove);
  elements.canvasImageWrap.addEventListener("pointerup", endImageInteraction);
  elements.canvasImageWrap.addEventListener("pointercancel", endImageInteraction);
  elements.canvasImageWrap.addEventListener("lostpointercapture", endImageInteraction);
  elements.addOption.addEventListener("click", function () {
    if (state.options.length >= 6) return;
    state.options.push("New option");
    render();
    const inputs = elements.options.querySelectorAll("input");
    inputs[inputs.length - 1].focus();
    inputs[inputs.length - 1].select();
  });
  elements.reset.addEventListener("click", function () {
    state = clone(blankState);
    imageInteraction = null;
    elements.imageInput.value = "";
    elements.canvasImageWrap.classList.remove("is-interacting");
    localStorage.removeItem(STORAGE_KEY);
    hydrateInputs();
    render();
    showToast("Template cleared. Paste in your question and options.");
  });
  elements.download.addEventListener("click", downloadPng);

  document.querySelectorAll(".format-button").forEach(function (button) {
    button.addEventListener("click", function () {
      state.format = button.dataset.format;
      render();
    });
  });

  document.querySelectorAll(".theme-button").forEach(function (button) {
    button.addEventListener("click", function () {
      state.theme = button.dataset.theme;
      state.accentColor = THEMES[state.theme].accent;
      state.cardColor = THEMES[state.theme].card;
      state.correctColor = THEMES[state.theme].correct;
      hydrateInputs();
      render();
    });
  });

  hydrateInputs();
  render();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!stored || !Array.isArray(stored.options)) return clone(defaultState);
      return Object.assign(clone(defaultState), stored, { options: stored.options.slice(0, 6) });
    } catch (error) {
      return clone(defaultState);
    }
  }

  function hydrateInputs() {
    elements.question.value = state.question;
    elements.accent.value = state.accent;
    elements.columns.value = String(state.columns);
    elements.questionSize.value = String(state.questionSize);
    elements.accentColor.value = state.accentColor;
    elements.cardColor.value = state.cardColor;
    elements.correctColor.value = state.correctColor;
    elements.highlightCorrect.checked = state.highlightCorrect;
    elements.imageFit.value = state.imageFit;
    elements.imageRatio.value = state.imageRatio;
    elements.ratioWidth.value = String(state.ratioWidth);
    elements.ratioHeight.value = String(state.ratioHeight);
    elements.autoFit.checked = state.autoFit;
    elements.imageScale.value = String(state.imageScale);
    elements.imageGap.value = String(state.imageGap);
  }

  function render() {
    renderOptionsEditor();
    renderCanvas();
    updateSelectionStates();
    scheduleSave();
  }

  function renderOptionsEditor() {
    elements.options.innerHTML = "";
    state.options.forEach(function (option, index) {
      const row = document.createElement("div");
      row.className = "option-row";
      row.innerHTML =
        '<span class="option-number">' + String(index + 1).padStart(2, "0") + '</span>' +
        '<input class="option-input" type="text" aria-label="Option ' + (index + 1) + '" value="" />' +
        '<button class="correct-toggle" type="button" aria-label="Mark option ' + (index + 1) + ' as correct" aria-pressed="false" title="Mark as correct">✓</button>' +
        '<button class="remove-option" type="button" aria-label="Remove option ' + (index + 1) + '">×</button>';
      const input = row.querySelector(".option-input");
      input.value = option;
      const correctToggle = row.querySelector(".correct-toggle");
      const isCorrect = state.correctIndex === index;
      correctToggle.classList.toggle("is-correct", isCorrect);
      correctToggle.setAttribute("aria-pressed", String(isCorrect));
      correctToggle.addEventListener("click", function () {
        state.correctIndex = index;
        render();
      });
      input.addEventListener("input", function (event) {
        state.options[index] = event.target.value;
        renderCanvas();
        scheduleSave();
      });
      row.querySelector(".remove-option").addEventListener("click", function () {
        if (state.options.length <= 2) {
          showToast("Keep at least two options.");
          return;
        }
        state.options.splice(index, 1);
        if (state.correctIndex === index) state.correctIndex = Math.min(index, state.options.length - 1);
        if (state.correctIndex > index) state.correctIndex -= 1;
        render();
      });
      elements.options.appendChild(row);
    });
    elements.optionCount.textContent = state.options.length + " / 6";
    elements.addOption.disabled = state.options.length >= 6;
    elements.addOption.style.opacity = state.options.length >= 6 ? "0.5" : "1";
  }

  function renderCanvas() {
    const format = FORMATS[state.format];
    const hasImage = Boolean(state.imageData);
    const metrics = getLayoutMetrics(hasImage);
    elements.canvas.dataset.format = state.format;
    elements.canvas.dataset.columns = String(state.columns);
    elements.canvas.dataset.theme = state.theme;
    elements.canvas.classList.toggle("has-image", hasImage);
    elements.canvas.style.setProperty("--canvas-accent", state.accentColor);
    elements.canvas.style.setProperty("--canvas-correct", state.correctColor);
    elements.canvas.style.setProperty("--canvas-correct-soft", hexToRgba(state.correctColor, state.theme === "midnight" ? 0.24 : 0.14));
    elements.canvas.style.setProperty("--canvas-card", hexToRgba(state.cardColor, state.theme === "midnight" ? 0.83 : 0.74));
    const questionScale = state.questionSize / 100;
    elements.canvasQuestion.style.top = metrics.questionTop + "%";
    elements.canvasQuestion.style.fontSize = "clamp(" + Math.round(18 * questionScale) + "px, " + (4.05 * questionScale).toFixed(2) + "cqw, " + Math.round(44 * questionScale) + "px)";
    elements.canvasQuestion.innerHTML = highlightedQuestion(state.question, state.accent);
    const imageSource = state.imageData || "";
    if (elements.canvasImage.getAttribute("src") !== imageSource) elements.canvasImage.setAttribute("src", imageSource);
    elements.canvasImage.style.objectFit = state.imageFit;
    elements.canvasImageWrap.classList.toggle("hidden", !hasImage);
    elements.canvasImageWrap.classList.toggle("is-manual", hasImage && !state.autoFit);
    elements.canvasImageWrap.dataset.layout = state.autoFit ? "auto" : "manual";
    const canvasRect = elements.canvas.getBoundingClientRect();
    const canvasWidth = canvasRect.width || 480;
    const canvasHeight = canvasRect.height || canvasWidth * (state.format === "portrait" ? 16 / 9 : state.format === "feed" ? 5 / 4 : 1);
    const questionRect = elements.canvasQuestion.getBoundingClientRect();
    const questionBottomPx = Math.max(questionRect.bottom - canvasRect.top, canvasHeight * 0.11);
    const imageLayout = hasImage ? getImageLayout(canvasWidth, canvasHeight, questionBottomPx) : null;
    if (imageLayout) {
      elements.canvasImageWrap.style.top = imageLayout.topPercent + "%";
      elements.canvasImageWrap.style.width = imageLayout.widthPercent + "%";
      elements.canvasImageWrap.style.left = imageLayout.leftPercent + "%";
      elements.canvasImageWrap.style.height = imageLayout.heightPercent + "%";
    }
    const questionAwareGridTopPx = questionBottomPx + canvasHeight * 0.06;
    const gridTopPx = imageLayout ? imageLayout.gridTop : state.autoFit ? Math.max(canvasHeight * (metrics.noImageGridTop / 100), questionAwareGridTopPx) : canvasHeight * (metrics.noImageGridTop / 100);
    const gridBottomPx = imageLayout ? imageLayout.gridBottom : state.autoFit ? Math.min(canvasHeight * 0.93, Math.max(canvasHeight * (metrics.gridBottom / 100), gridTopPx + canvasHeight * 0.18)) : canvasHeight * (metrics.gridBottom / 100);
    elements.cardsGrid.style.top = (gridTopPx / canvasHeight) * 100 + "%";
    elements.cardsGrid.style.bottom = 100 - ((gridBottomPx / canvasHeight) * 100) + "%";
    elements.cardsGrid.innerHTML = "";
    state.options.forEach(function (option, index) {
      const card = document.createElement("div");
      const isCorrect = state.highlightCorrect && state.correctIndex === index;
      card.className = "option-card" + (option.length > 11 ? " long" : "") + (isCorrect ? " is-correct" : "");
      card.textContent = option || "";
      elements.cardsGrid.appendChild(card);
    });
    elements.previewSize.textContent = format.width + " × " + format.height;
    elements.questionSizeValue.textContent = state.questionSize + "%";
    elements.imageScaleValue.textContent = state.imageScale + "%";
    elements.imageGapValue.textContent = state.imageGap + "%";
    renderImageEditorState();
  }

  function renderImageEditorState() {
    const hasImage = Boolean(state.imageData);
    elements.imageSelected.classList.toggle("hidden", !hasImage);
    elements.removeImage.classList.toggle("hidden", !hasImage);
    elements.imageControls.classList.toggle("hidden", !hasImage);
    elements.customRatio.classList.toggle("hidden", !hasImage || state.imageRatio !== "custom");
    elements.autoFit.checked = state.autoFit;
    elements.imageScale.value = String(state.imageScale);
    elements.imageGap.value = String(state.imageGap);
    elements.imageInteractionHint.textContent = state.autoFit
      ? "Auto-fit is on. Turn it off to drag or resize the image manually."
      : "Manual mode is on. Drag the image to move it, or drag a corner to resize it.";
    elements.imagePrompt.textContent = hasImage ? "Replace image" : "Choose an image";
    if (hasImage) {
      elements.imageThumb.src = state.imageData;
      elements.imageFileName.textContent = state.imageName || "Selected image";
    } else {
      elements.imageThumb.removeAttribute("src");
      elements.imageFileName.textContent = "";
    }
  }

  function handleImageSelection(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choose a JPG, PNG, or WebP image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      const image = new Image();
      image.onload = function () {
        const maxDimension = 1200;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const resized = document.createElement("canvas");
        resized.width = Math.max(1, Math.round(image.naturalWidth * scale));
        resized.height = Math.max(1, Math.round(image.naturalHeight * scale));
        resized.getContext("2d").drawImage(image, 0, 0, resized.width, resized.height);
        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        state.imageData = resized.toDataURL(outputType, 0.88);
        state.imageName = file.name;
        state.imageWidth = resized.width;
        state.imageHeight = resized.height;
        state.autoFit = true;
        state.imagePositionX = 50;
        state.imagePositionY = 0;
        state.imageFrameWidth = 0;
        render();
        showToast("Image added to the canvas.");
      };
      image.onerror = function () { showToast("That image could not be read."); };
      image.src = reader.result;
    };
    reader.onerror = function () { showToast("That image could not be read."); };
    reader.readAsDataURL(file);
  }

  function removeSelectedImage() {
    state.imageData = "";
    state.imageName = "";
    state.imageWidth = 0;
    state.imageHeight = 0;
    state.autoFit = true;
    state.imagePositionX = 50;
    state.imagePositionY = 0;
    state.imageFrameWidth = 0;
    elements.imageInput.value = "";
    render();
    showToast("Image removed.");
  }

  function getCurrentImageLayout(autoFitOverride) {
    const canvasRect = elements.canvas.getBoundingClientRect();
    const canvasWidth = canvasRect.width || 480;
    const canvasHeight = canvasRect.height || canvasWidth * (state.format === "portrait" ? 16 / 9 : state.format === "feed" ? 5 / 4 : 1);
    const questionRect = elements.canvasQuestion.getBoundingClientRect();
    const questionBottomPx = Math.max(questionRect.bottom - canvasRect.top, canvasHeight * 0.11);
    return getImageLayout(canvasWidth, canvasHeight, questionBottomPx, autoFitOverride);
  }

  function getLayoutMetrics(hasImage) {
    const imageQuestionTop = state.format === "square" ? 9 : 8.5;
    return {
      questionTop: hasImage ? imageQuestionTop : 17,
      imageMaxHeight: state.format === "portrait" ? 14 : 17,
      gridBottom: 82,
      noImageGridTop: state.format === "square" ? 39 : state.format === "feed" ? 35 : 30.7
    };
  }

  function getMinimumGridHeight(canvasHeight) {
    const rows = Math.ceil(state.options.length / state.columns);
    const gridGap = canvasHeight * 0.041;
    return Math.min(canvasHeight * 0.56, Math.max(canvasHeight * 0.2, rows * canvasHeight * 0.09 + Math.max(0, rows - 1) * gridGap));
  }

  function getImageLayout(canvasWidth, canvasHeight, questionBottomPx, autoFitOverride) {
    const autoFit = typeof autoFitOverride === "boolean" ? autoFitOverride : state.autoFit;
    const metrics = getLayoutMetrics(true);
    const frameAspect = Math.max(0.2, getFrameAspect());
    const imageScale = state.imageScale / 100;
    const maxWidthPx = Math.min(canvasWidth * 0.86, canvasWidth * 0.5 * imageScale);
    const maxHeightPx = canvasHeight * (metrics.imageMaxHeight / 100) * imageScale;
    let imageWidthPx = autoFit || !state.imageFrameWidth
      ? Math.min(maxWidthPx, maxHeightPx * frameAspect)
      : canvasWidth * clamp(state.imageFrameWidth, 20, 86) / 100;
    let imageHeightPx = imageWidthPx / frameAspect;

    if (autoFit && imageHeightPx > maxHeightPx) {
      imageHeightPx = maxHeightPx;
      imageWidthPx = imageHeightPx * frameAspect;
    }
    if (imageHeightPx > canvasHeight * 0.86) {
      imageHeightPx = canvasHeight * 0.86;
      imageWidthPx = imageHeightPx * frameAspect;
    }

    const gapBeforePx = canvasHeight * (Math.max(0, state.imageGap) / 100);
    const gapAfterPx = canvasHeight * 0.04;
    const gridBottomPx = canvasHeight * (metrics.gridBottom / 100);
    const minimumGridHeight = getMinimumGridHeight(canvasHeight);
    if (autoFit) {
      const availableImageHeight = gridBottomPx - questionBottomPx - gapBeforePx - gapAfterPx - minimumGridHeight;
      if (availableImageHeight > 0 && imageHeightPx > availableImageHeight) {
        imageHeightPx = availableImageHeight;
        imageWidthPx = imageHeightPx * frameAspect;
      }
    }

    const rawTopPx = autoFit ? questionBottomPx + gapBeforePx : canvasHeight * (Number(state.imagePositionY) || 0) / 100;
    const widthPercent = (imageWidthPx / canvasWidth) * 100;
    const heightPercent = (imageHeightPx / canvasHeight) * 100;
    const minTopPx = Math.max(canvasHeight * 0.02, questionBottomPx + canvasHeight * 0.005);
    const maxTopPx = Math.max(minTopPx, canvasHeight * 0.94 - imageHeightPx);
    const topPx = autoFit ? rawTopPx : clamp(rawTopPx, minTopPx, maxTopPx);
    const rawCenterX = autoFit ? 50 : Number(state.imagePositionX) || 50;
    const centerX = autoFit ? 50 : clamp(rawCenterX, widthPercent / 2 + 2, 98 - widthPercent / 2);
    const leftPx = canvasWidth * (centerX - widthPercent / 2) / 100;
    const gridTopPx = topPx + imageHeightPx + gapAfterPx;
    const adjustedGridBottomPx = autoFit
      ? gridBottomPx
      : Math.min(canvasHeight * 0.94, Math.max(gridBottomPx, gridTopPx + Math.min(minimumGridHeight, canvasHeight * 0.38)));

    return {
      leftPx: leftPx,
      topPx: topPx,
      widthPx: imageWidthPx,
      heightPx: imageHeightPx,
      leftPercent: (leftPx / canvasWidth) * 100,
      topPercent: (topPx / canvasHeight) * 100,
      widthPercent: widthPercent,
      heightPercent: heightPercent,
      centerX: centerX,
      gridTop: gridTopPx,
      gridBottom: adjustedGridBottomPx
    };
  }

  function beginImageInteraction(event, mode) {
    if (!state.imageData || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    const layout = getCurrentImageLayout(state.autoFit);
    if (!layout) return;
    const wasAutoFit = state.autoFit;
    state.autoFit = false;
    state.imagePositionX = layout.centerX;
    state.imagePositionY = layout.topPercent;
    state.imageFrameWidth = layout.widthPercent;
    imageInteraction = {
      pointerId: event.pointerId,
      mode: mode === "drag" ? "drag" : "resize",
      direction: mode === "drag" ? "" : mode,
      startX: event.clientX,
      startY: event.clientY,
      startCenterX: layout.centerX,
      startTopPercent: layout.topPercent,
      startWidthPercent: layout.widthPercent
    };
    elements.canvasImageWrap.classList.add("is-manual", "is-interacting");
    elements.canvasImageWrap.dataset.layout = "manual";
    elements.autoFit.checked = false;
    renderImageEditorState();
    if (wasAutoFit) showToast("Manual image layout enabled. Auto-fit is now off.");
    try {
      elements.canvasImageWrap.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is not available in a few embedded browsers; movement still works when the pointer stays over the image.
    }
  }

  function handleImagePointerMove(event) {
    if (!imageInteraction || event.pointerId !== imageInteraction.pointerId) return;
    event.preventDefault();
    const canvasRect = elements.canvas.getBoundingClientRect();
    if (!canvasRect.width || !canvasRect.height) return;
    const deltaX = event.clientX - imageInteraction.startX;
    const deltaY = event.clientY - imageInteraction.startY;
    let widthPercent = imageInteraction.startWidthPercent;
    let centerX = imageInteraction.startCenterX;
    let topPercent = imageInteraction.startTopPercent;

    if (imageInteraction.mode === "drag") {
      centerX += (deltaX / canvasRect.width) * 100;
      topPercent += (deltaY / canvasRect.height) * 100;
    } else {
      const frameAspect = Math.max(0.2, getFrameAspect());
      const signX = imageInteraction.direction.indexOf("e") !== -1 ? 1 : -1;
      const signY = imageInteraction.direction.indexOf("s") !== -1 ? 1 : -1;
      const widthDelta = ((deltaX * signX) + (deltaY * signY * frameAspect)) / 2 / canvasRect.width * 100;
      widthPercent = clamp(imageInteraction.startWidthPercent + widthDelta, 20, 86);
      const actualWidthDelta = widthPercent - imageInteraction.startWidthPercent;
      const heightDeltaPx = canvasRect.width * (actualWidthDelta / 100) / frameAspect;
      centerX += (imageInteraction.direction.indexOf("e") !== -1 ? 1 : -1) * actualWidthDelta / 2;
      if (imageInteraction.direction.indexOf("n") !== -1) topPercent -= (heightDeltaPx / canvasRect.height) * 100;
    }

    const heightPercent = widthPercent * canvasRect.width / canvasRect.height / Math.max(0.2, getFrameAspect());
    state.imagePositionX = clamp(centerX, widthPercent / 2 + 2, 98 - widthPercent / 2);
    state.imagePositionY = clamp(topPercent, 2, Math.max(2, 94 - heightPercent));
    state.imageFrameWidth = widthPercent;
    state.imageScale = clamp(Math.round((widthPercent / 50 * 100) / 5) * 5, 70, 220);
    const liveLayout = getCurrentImageLayout(false);
    if (liveLayout) {
      elements.canvasImageWrap.style.top = liveLayout.topPercent + "%";
      elements.canvasImageWrap.style.width = liveLayout.widthPercent + "%";
      elements.canvasImageWrap.style.left = liveLayout.leftPercent + "%";
      elements.canvasImageWrap.style.height = liveLayout.heightPercent + "%";
      const canvasHeight = canvasRect.height;
      elements.cardsGrid.style.top = (liveLayout.gridTop / canvasHeight) * 100 + "%";
      elements.cardsGrid.style.bottom = 100 - ((liveLayout.gridBottom / canvasHeight) * 100) + "%";
    }
    elements.imageScale.value = String(state.imageScale);
    elements.imageScaleValue.textContent = state.imageScale + "%";
    scheduleSave();
  }

  function endImageInteraction(event) {
    if (!imageInteraction || (event && event.pointerId !== imageInteraction.pointerId)) return;
    imageInteraction = null;
    elements.canvasImageWrap.classList.remove("is-interacting");
    renderImageEditorState();
    scheduleSave();
  }

  function updateSelectionStates() {
    document.querySelectorAll(".format-button").forEach(function (button) {
      button.classList.toggle("is-selected", button.dataset.format === state.format);
    });
    document.querySelectorAll(".theme-button").forEach(function (button) {
      button.classList.toggle("is-selected", button.dataset.theme === state.theme);
    });
  }

  function getFrameAspect() {
    const presetAspects = { square: 1, landscape: 4 / 3, wide: 16 / 9, portrait: 3 / 4 };
    if (state.imageRatio === "custom") {
      const width = Math.max(0.2, Number(state.ratioWidth) || 1);
      const height = Math.max(0.2, Number(state.ratioHeight) || 1);
      return width / height;
    }
    if (state.imageRatio === "original" && state.imageWidth && state.imageHeight) {
      return state.imageWidth / state.imageHeight;
    }
    return presetAspects[state.imageRatio] || 1.5;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function highlightedQuestion(question, accent) {
    if (!question) return "";
    const safeQuestion = escapeHtml(question || "Your question goes here");
    const safeAccent = escapeHtml(accent || "");
    if (!safeAccent || !safeQuestion.includes(safeAccent)) return safeQuestion;
    return safeQuestion.replace(safeAccent, '<span class="accent">' + safeAccent + '</span>');
  }

  function scheduleSave() {
    elements.saveStatus.textContent = "Saving…";
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(function () {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      elements.saveStatus.textContent = "Saved locally";
    }, 240);
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      elements.toast.classList.remove("is-visible");
    }, 2600);
  }

  async function downloadPng() {
    elements.download.disabled = true;
    elements.download.innerHTML = '<span aria-hidden="true">…</span> Preparing image';
    try {
      const format = FORMATS[state.format];
      const svg = createSvg(format.width, format.height);
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      await new Promise(function (resolve, reject) {
        image.onload = resolve;
        image.onerror = reject;
      });
      const canvas = document.createElement("canvas");
      canvas.width = format.width;
      canvas.height = format.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, format.width, format.height);
      URL.revokeObjectURL(url);
      const png = await new Promise(function (resolve) { canvas.toBlob(resolve, "image/png"); });
      const downloadUrl = URL.createObjectURL(png);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "quiz-canvas-" + Date.now() + ".png";
      link.click();
      URL.revokeObjectURL(downloadUrl);
      showToast("PNG downloaded.");
    } catch (error) {
      showToast("Could not export the image in this browser.");
    } finally {
      elements.download.disabled = false;
      elements.download.innerHTML = '<span aria-hidden="true">↓</span> Download PNG';
    }
  }

  function createSvg(width, height) {
    const colors = themeColors(state.theme, state.accentColor, state.cardColor);
    const margin = width * 0.08;
    let questionSize = Math.max(48, Math.min(82, 78 * state.questionSize / 100));
    let questionLines = wrapTextToWidth(state.question, width * 0.84, questionSize, 4);
    while (questionLines.length > 3 && questionSize > 42) {
      questionSize -= 4;
      questionLines = wrapTextToWidth(state.question, width * 0.84, questionSize, 4);
    }
    const questionLineHeight = questionSize * 1.06;
    const hasImage = Boolean(state.imageData);
    const metrics = getLayoutMetrics(hasImage);
    const questionTop = height * (metrics.questionTop / 100);
    const questionBottom = questionTop + questionLines.length * questionLineHeight;
    const questionSvg = questionLines.map(function (line, index) {
      const y = questionTop + questionSize + index * questionLineHeight;
      return '<text x="' + (width / 2) + '" y="' + y + '" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="' + questionSize + '" font-weight="800" letter-spacing="-3" fill="' + colors.text + '">' + highlightedSvgLine(line, state.accent, colors.accent) + '</text>';
    }).join("");

    let imageSvg = "";
    let imageY = 0;
    let imageHeight = 0;
    let imageLayout;
    if (hasImage) {
      imageLayout = getImageLayout(width, height, questionBottom, state.autoFit);
      const imageX = imageLayout.leftPx;
      const imageWidth = imageLayout.widthPx;
      imageY = imageLayout.topPx;
      imageHeight = imageLayout.heightPx;
      const preserveAspectRatio = state.imageFit === "cover" ? "xMidYMid slice" : "xMidYMid meet";
      imageSvg = '<rect x="' + imageX + '" y="' + imageY + '" width="' + imageWidth + '" height="' + imageHeight + '" rx="' + Math.min(30, imageWidth * 0.07) + '" fill="' + colors.card + '" stroke="' + colors.cardBorder + '" stroke-width="2" filter="url(#shadow)" />' +
        '<image href="' + state.imageData + '" x="' + imageX + '" y="' + imageY + '" width="' + imageWidth + '" height="' + imageHeight + '" preserveAspectRatio="' + preserveAspectRatio + '" clip-path="url(#imageClip)" />';
    }

    const columns = state.columns;
    const rows = Math.ceil(state.options.length / columns);
    const questionAwareGridTop = questionBottom + height * 0.06;
    const gridTop = hasImage ? imageLayout.gridTop : state.autoFit ? Math.max(height * (metrics.noImageGridTop / 100), questionAwareGridTop) : height * (metrics.noImageGridTop / 100);
    const gridBottom = hasImage ? imageLayout.gridBottom : state.autoFit ? Math.min(height * 0.93, Math.max(height * (metrics.gridBottom / 100), gridTop + height * 0.18)) : height * (metrics.gridBottom / 100);
    const gap = Math.max(24, width * 0.04);
    const cardWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
    const cardHeight = (gridBottom - gridTop - gap * (rows - 1)) / rows;
    const cardsSvg = state.options.map(function (option, index) {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = margin + col * (cardWidth + gap);
      const y = gridTop + row * (cardHeight + gap);
      const length = option.length;
      const fontSize = Math.max(31, Math.min(76, length > 11 ? 45 : 72 - Math.max(0, length - 4) * 4));
      const safeOption = escapeHtml(option || "");
      const isCorrect = state.highlightCorrect && state.correctIndex === index;
      const cardFill = isCorrect ? colors.correctCard : colors.card;
      const cardBorder = isCorrect ? colors.correct : colors.cardBorder;
      const optionColor = isCorrect ? colors.correct : colors.accent;
      const badge = isCorrect ? '<circle cx="' + (x + cardWidth - cardWidth * 0.1) + '" cy="' + (y + cardHeight * 0.1) + '" r="' + Math.min(15, cardWidth * 0.035) + '" fill="' + colors.correct + '"/><text x="' + (x + cardWidth - cardWidth * 0.1) + '" y="' + (y + cardHeight * 0.1 + 5) + '" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="' + Math.min(18, cardWidth * 0.04) + '" font-weight="800" fill="#ffffff">✓</text>' : "";
      return '<rect x="' + x + '" y="' + y + '" width="' + cardWidth + '" height="' + cardHeight + '" rx="' + Math.min(30, cardWidth * 0.07) + '" fill="' + cardFill + '" stroke="' + cardBorder + '" stroke-width="2" filter="url(#shadow)" />' + badge +
        '<text x="' + (x + cardWidth / 2) + '" y="' + (y + cardHeight / 2 + fontSize * 0.34) + '" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="' + fontSize + '" font-weight="800" letter-spacing="-2" fill="' + optionColor + '">' + safeOption + '</text>';
    }).join("");

    const waveY = height * 0.82;
    return '<?xml version="1.0" encoding="UTF-8"?>' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">' +
      '<defs>' +
      '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + colors.bg + '"/><stop offset="1" stop-color="' + colors.bgDeep + '"/></linearGradient>' +
      '<filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="13" stdDeviation="13" flood-color="' + colors.shadow + '" flood-opacity="0.2"/></filter>' +
      '<clipPath id="imageClip" clipPathUnits="objectBoundingBox"><rect x="0" y="0" width="1" height="1" rx="0.08" /></clipPath>' +
      '<pattern id="grain" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.75" fill="#ffffff" opacity="0.4"/></pattern>' +
      '</defs>' +
      '<rect width="100%" height="100%" fill="url(#bg)"/>' +
      '<rect width="100%" height="100%" fill="url(#grain)" opacity="0.22"/>' +
      questionSvg + imageSvg + cardsSvg +
      '<path d="M-' + width * 0.08 + ' ' + (waveY + height * 0.06) + ' C' + width * 0.2 + ' ' + (waveY - height * 0.02) + ', ' + width * 0.37 + ' ' + (waveY + height * 0.15) + ', ' + width * 0.58 + ' ' + (waveY + height * 0.04) + ' C' + width * 0.76 + ' ' + (waveY - height * 0.05) + ', ' + width * 0.9 + ' ' + (waveY + height * 0.09) + ', ' + width * 1.08 + ' ' + (waveY - height * 0.01) + ' L' + width * 1.08 + ' ' + height + ' L-' + width * 0.08 + ' ' + height + ' Z" fill="' + colors.wave + '"/>' +
      '<path d="M-' + width * 0.08 + ' ' + (waveY + height * 0.16) + ' C' + width * 0.19 + ' ' + (waveY + height * 0.08) + ', ' + width * 0.38 + ' ' + (waveY + height * 0.27) + ', ' + width * 0.61 + ' ' + (waveY + height * 0.12) + ' C' + width * 0.8 + ' ' + (waveY + height * 0.01) + ', ' + width * 0.93 + ' ' + (waveY + height * 0.2) + ', ' + width * 1.08 + ' ' + (waveY + height * 0.08) + ' L' + width * 1.08 + ' ' + height + ' L-' + width * 0.08 + ' ' + height + ' Z" fill="' + colors.wave + '" opacity="0.55"/>' +
      '</svg>';
  }

  function themeColors(theme, accent, card) {
    const fallback = {
      ice: { bg: "#eaf4ff", bgDeep: "#d4e9ff", text: "#0d1c3b", cardBorder: "#78b3ff", wave: "#ffffff", shadow: "#4874a6" },
      paper: { bg: "#faf6ef", bgDeep: "#eadfcf", text: "#332b27", cardBorder: "#cc9467", wave: "#ffffff", shadow: "#9f7e68" },
      midnight: { bg: "#161f39", bgDeep: "#0b1025", text: "#f2f5ff", cardBorder: "#77a9ff", wave: "#7393da", shadow: "#050814" },
      lilac: { bg: "#f1edff", bgDeep: "#ded7ff", text: "#271d47", cardBorder: "#8e74e8", wave: "#ffffff", shadow: "#7265a5" }
    }[theme] || {};
    return Object.assign({}, fallback, { accent: accent, correct: state.correctColor, correctCard: hexToRgba(state.correctColor, theme === "midnight" ? 0.24 : 0.14), card: hexToRgba(card, theme === "midnight" ? 0.88 : 0.78) });
  }

  function wrapText(value, maxChars) {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return ["Your question goes here"];
    const lines = [];
    let line = "";
    words.forEach(function (word) {
      const next = line ? line + " " + word : word;
      if (line && next.length > maxChars) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, 3);
  }

  function wrapTextToWidth(value, maxWidth, fontSize, maxLines) {
    const text = String(value || "").trim();
    if (!text) return [];
    const measureCanvas = document.createElement("canvas");
    const context = measureCanvas.getContext("2d");
    context.font = "800 " + fontSize + "px Arial";
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach(function (word) {
      const next = line ? line + " " + word : word;
      if (line && context.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, maxLines || lines.length);
  }

  function highlightedSvgLine(line, accent, accentColor) {
    const safeLine = escapeHtml(line);
    const safeAccent = escapeHtml(accent || "");
    if (!safeAccent || !safeLine.includes(safeAccent)) return safeLine;
    const parts = safeLine.split(safeAccent);
    return parts.map(function (part, index) {
      return (index ? '<tspan fill="' + accentColor + '">' + safeAccent + '</tspan>' : "") + part;
    }).join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character];
    });
  }

  function hexToRgba(hex, alpha) {
    const normalized = String(hex).replace("#", "");
    if (normalized.length !== 6) return "rgba(255,255,255," + alpha + ")";
    const red = parseInt(normalized.slice(0, 2), 16);
    const green = parseInt(normalized.slice(2, 4), 16);
    const blue = parseInt(normalized.slice(4, 6), 16);
    return "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
  }
})();
