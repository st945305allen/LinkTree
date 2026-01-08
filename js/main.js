/**
 * 主要 JavaScript 功能
 * 處理頁面互動功能
 */

// 載入動畫控制
function initLoader() {
  const loader = document.getElementById('loader');
  
  if (!loader) {
    return;
  }

  // 確保至少顯示 800ms 的載入動畫
  const minLoadTime = 800;
  const startTime = Date.now();

  function hideLoader() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minLoadTime - elapsed);

    setTimeout(function() {
      loader.classList.add('hidden');
      document.body.classList.add('loaded');
      
      // 動畫完成後移除 loader 元素（可選）
      setTimeout(function() {
        loader.remove();
      }, 500);
    }, remaining);
  }

  // 等待所有資源載入完成
  if (document.readyState === 'complete') {
    hideLoader();
  } else {
    window.addEventListener('load', hideLoader);
  }
}

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
  initLoader();
  initScrollTopButton();
  initSheetFrame();
  initDragAndDrop();
});

/**
 * 初始化返回頂部按鈕
 */
function initScrollTopButton() {
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  
  if (!scrollTopBtn) {
    console.warn('返回頂部按鈕元素未找到');
    return;
  }

  // 滾動事件監聽
  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    scrollTopBtn.style.display = scrollTop > 100 ? 'block' : 'none';
  });

  // 點擊事件
  scrollTopBtn.addEventListener('click', scrollToTop);
  
  // 鍵盤支援
  scrollTopBtn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  });
}

/**
 * 平滑滾動到頂部
 */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/**
 * 初始化 Sheet Frame 功能
 */
function initSheetFrame() {
  const floatingPassword = document.querySelector('.floating-password');
  const sheetFrame = document.getElementById('sheet-frame');
  const closeBtn = document.querySelector('.sheet-close-btn');

  if (!floatingPassword || !sheetFrame) {
    console.warn('Sheet Frame 相關元素未找到');
    return;
  }

  // 浮動按鈕點擊事件
  floatingPassword.addEventListener('click', toggleSheetFrame);
  
  // 鍵盤支援
  floatingPassword.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSheetFrame();
    }
  });

  // 關閉按鈕事件
  if (closeBtn) {
    closeBtn.addEventListener('click', toggleSheetFrame);
    
    closeBtn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleSheetFrame();
      }
    });
  }

  // ESC 鍵關閉
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !sheetFrame.classList.contains('hidden')) {
      toggleSheetFrame();
    }
  });
}

/**
 * 切換 Sheet Frame 顯示/隱藏
 */
function toggleSheetFrame() {
  const sheetFrame = document.getElementById('sheet-frame');
  
  if (!sheetFrame) {
    console.error('Sheet Frame 元素未找到');
    return;
  }

  const isHidden = sheetFrame.classList.contains('hidden');
  
  if (isHidden) {
    sheetFrame.classList.remove('hidden');
    sheetFrame.style.display = 'flex';
  } else {
    sheetFrame.classList.add('hidden');
    sheetFrame.style.display = 'none';
  }
}

/**
 * 初始化拖動功能
 */
function initDragAndDrop() {
  const sheetHeader = document.getElementById('sheet-header');
  const sheetContainer = document.getElementById('sheet-frame');

  if (!sheetHeader || !sheetContainer) {
    return;
  }

  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  // 觸控事件支援
  sheetHeader.addEventListener('mousedown', dragStart);
  sheetHeader.addEventListener('touchstart', dragStart, { passive: false });

  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag, { passive: false });

  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('touchend', dragEnd);

  function dragStart(e) {
    if (e.type === 'touchstart') {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === sheetHeader || sheetHeader.contains(e.target)) {
      isDragging = true;
      sheetHeader.style.cursor = 'grabbing';
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, sheetContainer);
    }
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    sheetHeader.style.cursor = 'move';
  }

  function setTranslate(xPos, yPos, el) {
    // 限制拖動範圍在視窗內
    const maxX = window.innerWidth - el.offsetWidth;
    const maxY = window.innerHeight - el.offsetHeight;
    
    xPos = Math.max(0, Math.min(xPos, maxX));
    yPos = Math.max(0, Math.min(yPos, maxY));

    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }

  // 重置位置功能（雙擊標題列）
  sheetHeader.addEventListener('dblclick', function() {
    sheetContainer.style.transform = 'translate(0, 0)';
    xOffset = 0;
    yOffset = 0;
  });
}
