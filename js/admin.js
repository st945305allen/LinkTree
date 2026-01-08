/**
 * Timeline 管理後台功能
 */

let allProductsData = [];

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
  loadProductsData();
  initTabs();
  initForms();
  initDownload();
});

/**
 * 載入產品資料
 */
async function loadProductsData() {
  try {
    const response = await fetch('./data/products.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    allProductsData = await response.json();
    
    // 按上市時間排序
    allProductsData.sort((a, b) => {
      return new Date(a.上市時間) - new Date(b.上市時間);
    });
    
    // 更新顯示
    updateDataDisplay();
    updateJsonPreview();
    
  } catch (error) {
    console.error('載入產品資料失敗:', error);
    showMessage('無法載入產品資料，請稍後再試。', 'error');
  }
}

/**
 * 初始化選項卡
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // 移除所有活動狀態
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // 設置新的活動狀態
      button.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
      
      // 如果切換到下載頁面，更新 JSON 預覽
      if (targetTab === 'download') {
        updateJsonPreview();
      }
    });
  });
}

/**
 * 初始化表單
 */
function initForms() {
  // 新增單筆資料表單
  const addForm = document.getElementById('add-form');
  if (addForm) {
    addForm.addEventListener('submit', handleAddForm);
  }
  
  // 批次輸入表單
  const batchForm = document.getElementById('batch-form');
  if (batchForm) {
    batchForm.addEventListener('submit', handleBatchForm);
  }
  
  // 清空批次輸入
  const clearBatchBtn = document.getElementById('clear-batch');
  if (clearBatchBtn) {
    clearBatchBtn.addEventListener('click', () => {
      document.getElementById('batch-input').value = '';
      document.getElementById('batch-result').style.display = 'none';
    });
  }
  
  // 批次刪除功能
  initBatchDelete();
}

/**
 * 處理新增表單
 */
function handleAddForm(e) {
  e.preventDefault();
  
  const game = document.getElementById('game-input').value.trim();
  const set = document.getElementById('set-input').value.trim();
  const date = document.getElementById('date-input').value;
  
  if (!game || !set || !date) {
    showMessage('請填寫所有欄位', 'error');
    return;
  }
  
  // 檢查是否已存在
  const exists = allProductsData.some(item => 
    item.遊戲 === game && item.彈數 === set && item.上市時間 === date
  );
  
  if (exists) {
    showMessage('此筆資料已存在', 'error');
    return;
  }
  
  // 新增資料
  allProductsData.push({
    遊戲: game,
    彈數: set,
    上市時間: date
  });
  
  // 重新排序
  allProductsData.sort((a, b) => {
    return new Date(a.上市時間) - new Date(b.上市時間);
  });
  
  // 更新顯示
  updateDataDisplay();
  updateJsonPreview();
  
  // 重置表單
  e.target.reset();
  
  showMessage('資料新增成功！', 'success');
}

/**
 * 處理批次輸入表單
 */
function handleBatchForm(e) {
  e.preventDefault();
  
  const batchInput = document.getElementById('batch-input').value.trim();
  const batchResult = document.getElementById('batch-result');
  
  if (!batchInput) {
    showMessage('請輸入資料', 'error', batchResult);
    return;
  }
  
  const lines = batchInput.split('\n').filter(line => line.trim());
  const newItems = [];
  const errors = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    const parts = trimmedLine.split(',').map(part => part.trim());
    
    if (parts.length !== 3) {
      errors.push(`第 ${index + 1} 行格式錯誤：${trimmedLine}`);
      return;
    }
    
    const [game, set, date] = parts;
    
    // 驗證日期格式
    if (!isValidDate(date)) {
      errors.push(`第 ${index + 1} 行日期格式錯誤：${date}`);
      return;
    }
    
    // 檢查是否已存在
    const exists = allProductsData.some(item => 
      item.遊戲 === game && item.彈數 === set && item.上市時間 === date
    );
    
    if (exists) {
      errors.push(`第 ${index + 1} 行資料已存在：${trimmedLine}`);
      return;
    }
    
    newItems.push({
      遊戲: game,
      彈數: set,
      上市時間: date
    });
  });
  
  if (errors.length > 0) {
    showMessage(`處理完成，但有 ${errors.length} 個錯誤：\n${errors.join('\n')}`, 'error', batchResult);
    if (newItems.length > 0) {
      allProductsData.push(...newItems);
      allProductsData.sort((a, b) => {
        return new Date(a.上市時間) - new Date(b.上市時間);
      });
      updateDataDisplay();
      updateJsonPreview();
    }
    return;
  }
  
  if (newItems.length === 0) {
    showMessage('沒有有效的資料可新增', 'error', batchResult);
    return;
  }
  
  // 新增所有資料
  allProductsData.push(...newItems);
  
  // 重新排序
  allProductsData.sort((a, b) => {
    return new Date(a.上市時間) - new Date(b.上市時間);
  });
  
  // 更新顯示
  updateDataDisplay();
  updateJsonPreview();
  
  showMessage(`成功新增 ${newItems.length} 筆資料！`, 'success', batchResult);
}

/**
 * 驗證日期格式
 */
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * 更新資料顯示
 */
function updateDataDisplay() {
  const tableBody = document.getElementById('data-table-body');
  const totalCount = document.getElementById('total-count');
  const upcomingCount = document.getElementById('upcoming-count');
  
  if (!tableBody) return;
  
  // 計算今天及以後的數量
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = allProductsData.filter(item => {
    const releaseDate = new Date(item.上市時間);
    releaseDate.setHours(0, 0, 0, 0);
    return releaseDate >= today;
  });
  
  if (totalCount) totalCount.textContent = allProductsData.length;
  if (upcomingCount) upcomingCount.textContent = upcoming.length;
  
  // 清空表格
  tableBody.innerHTML = '';
  
  // 生成表格行
  allProductsData.forEach((item, index) => {
    const row = createTableRow(item, index);
    tableBody.appendChild(row);
  });
  
  // 重置選擇計數
  updateSelectedCount();
}

/**
 * 創建表格行
 */
function createTableRow(item, index) {
  const row = document.createElement('tr');
  row.setAttribute('data-index', index);
  
  // 判斷狀態
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const releaseDate = new Date(item.上市時間);
  releaseDate.setHours(0, 0, 0, 0);
  
  let statusClass = 'past';
  let statusText = '已上市';
  
  if (releaseDate > today) {
    statusClass = 'upcoming';
    statusText = '即將上市';
  } else if (releaseDate.getTime() === today.getTime()) {
    statusClass = 'released';
    statusText = '今日上市';
  }
  
  // 創建複選框
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'row-checkbox';
  checkbox.setAttribute('data-index', index);
  checkbox.addEventListener('change', updateSelectedCount);
  
  // 創建刪除按鈕
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = '刪除';
  deleteBtn.addEventListener('click', () => deleteItem(index));
  
  row.innerHTML = `
    <td></td>
    <td>${item.遊戲}</td>
    <td>${item.彈數}</td>
    <td>${item.上市時間}</td>
    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
    <td></td>
  `;
  
  // 將複選框和刪除按鈕添加到對應的 td
  const firstTd = row.querySelector('td:first-child');
  firstTd.appendChild(checkbox);
  
  const lastTd = row.querySelector('td:last-child');
  lastTd.appendChild(deleteBtn);
  
  return row;
}

/**
 * 初始化批次刪除功能
 */
function initBatchDelete() {
  const selectAllBtn = document.getElementById('select-all-btn');
  const deselectAllBtn = document.getElementById('deselect-all-btn');
  const selectPastBtn = document.getElementById('select-past-btn');
  const batchDeleteBtn = document.getElementById('batch-delete-btn');
  const deletePastBtn = document.getElementById('delete-past-btn');
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', selectAll);
  }
  
  if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', deselectAll);
  }
  
  if (selectPastBtn) {
    selectPastBtn.addEventListener('click', selectPastItems);
  }
  
  if (batchDeleteBtn) {
    batchDeleteBtn.addEventListener('click', handleBatchDelete);
  }
  
  if (deletePastBtn) {
    deletePastBtn.addEventListener('click', handleDeletePastItems);
  }
  
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
      if (this.checked) {
        selectAll();
      } else {
        deselectAll();
      }
    });
  }
}

/**
 * 全選
 */
function selectAll() {
  const checkboxes = document.querySelectorAll('.row-checkbox');
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = true;
  }
  
  updateSelectedCount();
}

/**
 * 取消全選
 */
function deselectAll() {
  const checkboxes = document.querySelectorAll('.row-checkbox');
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  
  if (selectAllCheckbox) {
    selectAllCheckbox.checked = false;
  }
  
  updateSelectedCount();
}

/**
 * 更新選擇計數
 */
function updateSelectedCount() {
  const checkboxes = document.querySelectorAll('.row-checkbox:checked');
  const selectedCount = document.getElementById('selected-count');
  const batchDeleteBtn = document.getElementById('batch-delete-btn');
  const selectAllCheckbox = document.getElementById('select-all-checkbox');
  
  const count = checkboxes.length;
  
  if (selectedCount) {
    selectedCount.textContent = count;
  }
  
  if (batchDeleteBtn) {
    batchDeleteBtn.disabled = count === 0;
  }
  
  // 更新全選複選框狀態
  if (selectAllCheckbox) {
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    selectAllCheckbox.checked = allCheckboxes.length > 0 && count === allCheckboxes.length;
    selectAllCheckbox.indeterminate = count > 0 && count < allCheckboxes.length;
  }
}

/**
 * 選擇已上市的項目
 */
function selectPastItems() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 先取消全選
  deselectAll();
  
  // 選擇所有已上市的項目
  const checkboxes = document.querySelectorAll('.row-checkbox');
  checkboxes.forEach((checkbox, index) => {
    const item = allProductsData[index];
    if (item) {
      const releaseDate = new Date(item.上市時間);
      releaseDate.setHours(0, 0, 0, 0);
      
      // 只選擇已過去的項目（不包含今天）
      if (releaseDate < today) {
        checkbox.checked = true;
      }
    }
  });
  
  updateSelectedCount();
  
  const selectedCount = document.querySelectorAll('.row-checkbox:checked').length;
  if (selectedCount > 0) {
    showMessage(`已選擇 ${selectedCount} 筆已上市資料`, 'success');
  } else {
    showMessage('沒有已上市的資料', 'error');
  }
}

/**
 * 批次刪除已上市的資料
 */
function handleDeletePastItems() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 找出所有已上市的項目
  const pastItems = allProductsData.filter((item, index) => {
    const releaseDate = new Date(item.上市時間);
    releaseDate.setHours(0, 0, 0, 0);
    return releaseDate < today;
  });
  
  if (pastItems.length === 0) {
    showMessage('沒有已上市的資料可刪除', 'error');
    return;
  }
  
  if (!confirm(`確定要刪除所有已上市的 ${pastItems.length} 筆資料嗎？此操作無法復原。`)) {
    return;
  }
  
  // 從後往前刪除，避免索引變化
  for (let i = allProductsData.length - 1; i >= 0; i--) {
    const item = allProductsData[i];
    const releaseDate = new Date(item.上市時間);
    releaseDate.setHours(0, 0, 0, 0);
    
    if (releaseDate < today) {
      allProductsData.splice(i, 1);
    }
  }
  
  // 更新顯示
  updateDataDisplay();
  updateJsonPreview();
  
  showMessage(`成功刪除 ${pastItems.length} 筆已上市資料`, 'success');
}

/**
 * 處理批次刪除
 */
function handleBatchDelete() {
  const checkboxes = document.querySelectorAll('.row-checkbox:checked');
  const count = checkboxes.length;
  
  if (count === 0) {
    showMessage('請選擇要刪除的項目', 'error');
    return;
  }
  
  if (!confirm(`確定要刪除選取的 ${count} 筆資料嗎？此操作無法復原。`)) {
    return;
  }
  
  // 收集要刪除的索引（從大到小排序，避免刪除後索引變化）
  const indicesToDelete = Array.from(checkboxes)
    .map(checkbox => parseInt(checkbox.getAttribute('data-index')))
    .sort((a, b) => b - a);
  
  // 刪除資料
  indicesToDelete.forEach(index => {
    allProductsData.splice(index, 1);
  });
  
  // 更新顯示
  updateDataDisplay();
  updateJsonPreview();
  
  showMessage(`成功刪除 ${count} 筆資料`, 'success');
}

/**
 * 刪除項目
 */
function deleteItem(index) {
  if (confirm('確定要刪除此筆資料嗎？')) {
    allProductsData.splice(index, 1);
    updateDataDisplay();
    updateJsonPreview();
    showMessage('資料已刪除', 'success');
  }
}

/**
 * 初始化下載功能
 */
function initDownload() {
  const downloadBtn = document.getElementById('download-btn');
  const copyJsonBtn = document.getElementById('copy-json-btn');
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadJson);
  }
  
  if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', copyJson);
  }
}

/**
 * 更新 JSON 預覽
 */
function updateJsonPreview() {
  const preview = document.getElementById('json-preview');
  if (preview) {
    preview.textContent = JSON.stringify(allProductsData, null, 2);
  }
}

/**
 * 下載 JSON 檔案
 */
function downloadJson() {
  const jsonString = JSON.stringify(allProductsData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showMessage('JSON 檔案下載成功！', 'success');
}

/**
 * 複製 JSON
 */
async function copyJson() {
  const jsonString = JSON.stringify(allProductsData, null, 2);
  
  try {
    await navigator.clipboard.writeText(jsonString);
    showMessage('JSON 已複製到剪貼簿！', 'success');
  } catch (err) {
    // 降級方案
    const textarea = document.createElement('textarea');
    textarea.value = jsonString;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showMessage('JSON 已複製到剪貼簿！', 'success');
  }
}

/**
 * 顯示訊息
 */
function showMessage(message, type, container) {
  const resultContainer = container || document.getElementById('batch-result');
  if (!resultContainer) return;
  
  resultContainer.className = `batch-result ${type}`;
  resultContainer.textContent = message;
  resultContainer.style.display = 'block';
  
  // 如果是成功訊息，3秒後自動隱藏
  if (type === 'success' && !container) {
    setTimeout(() => {
      resultContainer.style.display = 'none';
    }, 3000);
  }
}
