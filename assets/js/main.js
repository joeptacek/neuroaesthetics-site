// View Toggle

var VTContainers = document.getElementsByClassName('js-vt-container');
if (VTContainers) {
  function showHideInit(el) {
    var elChildren = el.children;
    for (var i = 0; i < elChildren.length; i++) {
      elChildren[i].classList.add('dni');
    }
  }

  function showMoreInit(el, showMoreInitVisible) {
    var elChildren = el.children;
    for (var i = 0; i < elChildren.length; i++) {
      if (i > showMoreInitVisible - 1) {
        elChildren[i].classList.add('dni');
      }
    }
  }

  function showHide(el, elVTButtonExtraLineCSS) {
    var elChildren = el.children;
    var elVTContainer = el.closest('.js-vt-container');
    var elVTButton = elVTContainer.querySelector('.js-vt-button');
    for (var i = 0; i < elChildren.length; i++) {
      elChildren[i].classList.toggle('dni');
    }
    if (elVTButtonExtraLineCSS) {
      elVTButton.classList.toggle('bt');
      elVTButton.classList.toggle(elVTButtonExtraLineCSS);
    }
  }

  function showMore(el, showMoreMax) {
    var flipCount = 0;
    var elChildren = el.children;
    var elVTContainer = el.closest('.js-vt-container');
    var elVTButtonWrap = elVTContainer.querySelector('.js-vt-button-wrap');
    for (var i = 0; i < elChildren.length; i++) {
      if (elChildren[i].classList.contains('dni')) {
        elChildren[i].classList.remove('dni');
        // elChildren[i].classList.remove('dni-ns'); // ??
        flipCount++;
        if (i < elChildren.length - 1) {
          if (flipCount > showMoreMax - 1) {
            break;
          }
        } else {
          elVTButtonWrap.classList.add('dni');
        }
      }
    }
  }

  function VTHandler(e) {
    var clickedVTButton = e.currentTarget;
    var clickedVTButtonExtraLineCSS = clickedVTButton.getAttribute('data-vt-button-extra-line-css');
    var clickedVTContainer = clickedVTButton.closest('.js-vt-container');
    var clickedVTViewer = clickedVTContainer.querySelector('.js-vt-viewer');
    var clickedVTViewerType = clickedVTViewer.getAttribute('data-vt-viewer-type');
    var clickedVTViewerShowMoreMax = clickedVTViewer.getAttribute('data-vt-show-more-max');
    switch (clickedVTViewerType) {
      case 'show-hide':
        showHide(clickedVTViewer, clickedVTButtonExtraLineCSS);
        break;
      case 'show-more':
        showMore(clickedVTViewer, clickedVTViewerShowMoreMax);
        break;
    }
  }

  for (var i = 0; i < VTContainers.length; i++) {
    var thisVTContainer = VTContainers[i];
    var thisVTButton = thisVTContainer.querySelector('.js-vt-button');
    var thisVTViewer = thisVTContainer.querySelector('.js-vt-viewer');
    var thisVTViewerType = thisVTViewer.getAttribute('data-vt-viewer-type');
    var thisVTViewerInitVisible = thisVTViewer.getAttribute('data-vt-show-more-init-visible');
    switch (thisVTViewerType) {
      case 'show-hide':
        showHideInit(thisVTViewer);
        break;
      case 'show-more':
        showMoreInit(thisVTViewer, thisVTViewerInitVisible);
        break;
    }
    thisVTButton.addEventListener('click', VTHandler);
  }
}

// Carousel

var carouselContainers = document.getElementsByClassName('js-carousel-container');
if (carouselContainers) {
  function carouselContainerInit(el) {
    var elChildren = el.children;
    for (var i = 0; i < elChildren.length; i++) {
      elChildren[i].classList.add('transition-opacity');
      if (i > 0) {
        // make all children opaque except first child
        elChildren[i].classList.add('o-0');
      }
    }
  }

  function carouselContainerAdvanceAll() {
    for (var i = 0; i < carouselContainers.length; i++) {
      var el = carouselContainers[i];
      var elChildren = el.children;
      var nextIndex;
      for (var j = 0; j < elChildren.length; j++) {
        if (!elChildren[j].classList.contains('o-0')) {
          if (j < elChildren.length - 1) {
            nextIndex = j + 1;
          } else {
            nextIndex = 0;
          }
          elChildren[j].classList.add('o-0');
          elChildren[nextIndex].classList.remove('o-0');
          break;
        }
      }
    }
  }

  for (var i = 0; i < carouselContainers.length; i++) {
    carouselContainerInit(carouselContainers[i]);
  }

  function intervalGo() {
    window.setInterval(carouselContainerAdvanceAll, 4500);
  }

  switch (document.readyState) {
    case 'loading':
      window.addEventListener('load', intervalGo);
      break;
    default:
      intervalGo();
  }
}
