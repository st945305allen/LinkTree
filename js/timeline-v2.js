(function () {
  // VARIABLES
  const timeline = document.querySelector(".timeline ol"),
    arrows = document.querySelectorAll(".timeline .arrows .arrow"),
    arrowPrev = document.querySelector(".timeline .arrows .arrow__prev"),
    arrowNext = document.querySelector(".timeline .arrows .arrow__next"),
    xScrolling = 280,
    disabledClass = "disabled";

  let productsData = [];
  let filteredData = [];

  // 載入產品資料
  async function loadProductsData() {
    try {
      const response = await fetch("./data/products.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      let allProducts = await response.json();

      // 過濾今天及以後的產品
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      productsData = allProducts.filter((item) => {
        const releaseDate = new Date(item.上市時間);
        releaseDate.setHours(0, 0, 0, 0);
        return releaseDate >= today;
      });

      // 按上市時間排序
      productsData.sort((a, b) => {
        return new Date(a.上市時間) - new Date(b.上市時間);
      });

      filteredData = productsData;

      // 初始化篩選按鈕
      initFilters();

      // 渲染 Timeline
      renderTimeline();
    } catch (error) {
      console.error("載入產品資料失敗:", error);
    }
  }

  // 初始化篩選按鈕
  function initFilters() {
    const filtersContainer = document.querySelector(".timeline-filters");
    if (!filtersContainer) return;

    // 為"全部"按鈕添加事件
    const allBtn = filtersContainer.querySelector('[data-game="all"]');
    if (allBtn) {
      allBtn.addEventListener("click", () => filterByGame("all"));
    }

    // 取得所有遊戲名稱（去重）
    const games = [...new Set(productsData.map((item) => item.遊戲))];

    // 為每個遊戲創建篩選按鈕
    games.forEach((game) => {
      const button = document.createElement("button");
      button.className = "filter-btn";
      button.textContent = game;
      button.setAttribute("data-game", game);
      button.addEventListener("click", () => filterByGame(game));
      filtersContainer.appendChild(button);
    });
  }

  // 依遊戲篩選
  function filterByGame(game) {
    // 更新按鈕狀態
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    const activeBtn = document.querySelector(`[data-game="${game}"]`);
    if (activeBtn) {
      activeBtn.classList.add("active");
    }

    // 篩選資料
    if (game === "all") {
      filteredData = productsData;
    } else {
      filteredData = productsData.filter((item) => item.遊戲 === game);
    }

    // 重新渲染
    renderTimeline();
  }

  // 計算兩個日期之間的天數
  function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
  }

  // 渲染 Timeline
  function renderTimeline() {
    if (!timeline) return;

    timeline.innerHTML = "";

    // 按日期分組
    const groupedByDate = {};
    filteredData.forEach((item) => {
      const date = new Date(item.上市時間);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = [];
      }
      groupedByDate[dateStr].push(item);
    });

    // 按日期排序
    const sortedDates = Object.keys(groupedByDate).sort();
    
    if (sortedDates.length === 0) return;

    // 計算總時間範圍（天數）
    const firstDate = new Date(sortedDates[0]);
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const totalDays = daysBetween(firstDate, lastDate);
    
    // 最小寬度（px）和最大寬度（px）
    const minWidth = 100;
    const maxWidth = 400;
    const baseWidth = 160;
    
    // 為每個日期創建一個 timeline 項目
    const isMobile = window.innerWidth <= 900;
    
    sortedDates.forEach((dateStr, index) => {
      const items = groupedByDate[dateStr];
      const li = document.createElement("li");
      
      // 只在桌機模式下計算動態寬度
      if (!isMobile) {
        // 計算當前日期與前一個日期之間的間隔
        let width = baseWidth;
        if (index > 0) {
          const prevDate = new Date(sortedDates[index - 1]);
          const currentDate = new Date(dateStr);
          const daysDiff = daysBetween(prevDate, currentDate);
          
          // 根據天數差距計算寬度（比例縮放）
          if (totalDays > 0) {
            // 使用對數縮放來處理較大的時間跨度
            const ratio = daysDiff / totalDays;
            width = Math.max(minWidth, Math.min(maxWidth, baseWidth * (1 + ratio * 3)));
          }
        }
        
        // 設置寬度
        li.style.width = `${width}px`;
      }

      // 合併相同日期的內容
      const content = items
        .map((item) => `${item.遊戲} - ${item.彈數}`)
        .join("<br>");

      const div = document.createElement("div");
      div.innerHTML = `<time>${dateStr}</time> ${content}`;
      li.appendChild(div);
      timeline.appendChild(li);
    });

    // 添加最後一個空項目（只在桌機模式下需要）
    if (!isMobile) {
      const lastLi = document.createElement("li");
      lastLi.style.width = "280px";
      timeline.appendChild(lastLi);
    }

    // 初始化
    window.addEventListener("load", init);
    if (document.readyState === "complete") {
      init();
    }
  }

  // START
  function init() {
    // 小螢幕（含平板）改用直式排版，不啟動橫向滾動與鍵盤控制
    if (window.innerWidth <= 900) {
      // 小螢幕不需要設置相同高度，讓內容自然展開
      return;
    }

    const elH = document.querySelectorAll(".timeline li > div");
    const firstItem = document.querySelector(".timeline li:first-child");
    const lastItem = document.querySelector(".timeline li:last-child");

    if (elH.length > 0) {
      setEqualHeights(elH);
    }
    
    if (arrowPrev && arrowNext && timeline) {
      animateTl(xScrolling, arrows, timeline);
      setKeyboardFn(arrowPrev, arrowNext);
    }
  }

  // SET EQUAL HEIGHTS
  function setEqualHeights(el) {
    let counter = 0;
    for (let i = 0; i < el.length; i++) {
      const singleHeight = el[i].offsetHeight;

      if (counter < singleHeight) {
        counter = singleHeight;
      }
    }

    for (let i = 0; i < el.length; i++) {
      el[i].style.height = `${counter}px`;
    }
  }

  // CHECK IF AN ELEMENT IS IN VIEWPORT
  // http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // SET STATE OF PREV/NEXT ARROWS
  function setBtnState(el, flag = true) {
    if (flag) {
      el.classList.add(disabledClass);
    } else {
      if (el.classList.contains(disabledClass)) {
        el.classList.remove(disabledClass);
      }
      el.disabled = false;
    }
  }

  // ANIMATE TIMELINE
  function animateTl(scrolling, el, tl) {
    let counter = 0;
    const firstItem = document.querySelector(".timeline li:first-child");
    const lastItem = document.querySelector(".timeline li:last-child");

    for (let i = 0; i < el.length; i++) {
      el[i].addEventListener("click", function () {
        if (!arrowPrev.disabled) {
          arrowPrev.disabled = true;
        }
        if (!arrowNext.disabled) {
          arrowNext.disabled = true;
        }
        const sign = this.classList.contains("arrow__prev") ? "" : "-";
        if (counter === 0) {
          tl.style.transform = `translateX(-${scrolling}px)`;
        } else {
          const tlStyle = getComputedStyle(tl);
          // add more browser prefixes if needed here
          const tlTransform =
            tlStyle.getPropertyValue("-webkit-transform") ||
            tlStyle.getPropertyValue("transform");
          const values =
            parseInt(tlTransform.split(",")[4]) +
            parseInt(`${sign}${scrolling}`);
          tl.style.transform = `translateX(${values}px)`;
        }

        setTimeout(() => {
          isElementInViewport(firstItem)
            ? setBtnState(arrowPrev)
            : setBtnState(arrowPrev, false);
          isElementInViewport(lastItem)
            ? setBtnState(arrowNext)
            : setBtnState(arrowNext, false);
        }, 1100);

        counter++;
      });
    }
  }

  // ADD BASIC KEYBOARD FUNCTIONALITY
  function setKeyboardFn(prev, next) {
    document.addEventListener("keydown", (e) => {
      if (e.which === 37 || e.which === 39) {
        const timelineOfTop = timeline.offsetTop;
        const y = window.pageYOffset;
        if (timelineOfTop !== y) {
          window.scrollTo(0, timelineOfTop);
        }
        if (e.which === 37) {
          prev.click();
        } else if (e.which === 39) {
          next.click();
        }
      }
    });
  }

  // 視窗大小改變時重新初始化（切換桌機/手機模式）
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // 如果已經有資料，重新初始化
      if (filteredData.length > 0) {
        renderTimeline();
      }
    }, 250);
  });

  // 初始化載入資料
  document.addEventListener("DOMContentLoaded", loadProductsData);
})();
