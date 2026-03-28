// GASのウェブアプリURLをセット
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwenUyI7wavfGx-4UCqujB75teY_5mr7ZHlR0r4qt825BwL8lRHThuBjPgIB7cW18SNcg/exec';

document.addEventListener('DOMContentLoaded', () => {
  // Service Worker Registration (for PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker Registered'))
      .catch(err => console.log('Service Worker Registration Failed', err));
  }

  // --- テーマ（ダークモード）設定機能 ---
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  
  // OSのデフォルト設定チェックとローカルストレージからの読み込み
  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };
  
  const setTheme = (theme) => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      themeIcon.textContent = 'light_mode';
    } else {
      document.body.classList.remove('dark-theme');
      themeIcon.textContent = 'dark_mode';
    }
    localStorage.setItem('theme', theme);
  };
  
  // 初回ロード時にテーマを反映
  setTheme(getPreferredTheme());
  
  // トグルボタンで切り替え
  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    setTheme(isDark ? 'light' : 'dark');
  });

  // --- 更新履歴モーダル ---
  const historyBtn = document.getElementById('historyBtn');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const historyModal = document.getElementById('historyModal');

  if (historyBtn && historyModal && closeHistoryBtn) {
    historyBtn.addEventListener('click', () => {
      historyModal.style.display = 'flex';
    });
    closeHistoryBtn.addEventListener('click', () => {
      historyModal.style.display = 'none';
    });
    // モーダル外の灰色部分クリックで閉じる
    historyModal.addEventListener('click', (e) => {
      if (e.target === historyModal) {
        historyModal.style.display = 'none';
      }
    });
  }

  // --- PINコード認証機能 ---
  const CORRECT_PIN = '8005';
  let enteredPin = '';
  
  const pinOverlay = document.getElementById('pinOverlay');
  const appContainer = document.getElementById('appContainer');
  const pinDots = document.querySelectorAll('.pin-dot');
  const pinBtns = document.querySelectorAll('.pin-btn[data-val]');
  const pinClearBtn = document.getElementById('pinClearBtn');
  const pinErrorMsg = document.getElementById('pinErrorMsg');

  // ローカルストレージに認証フラグがあるかチェック
  if (localStorage.getItem('nippou_auth_passed') === 'true') {
    pinOverlay.style.display = 'none';
    appContainer.style.display = 'block';
  } else {
    // 認証されていない場合は画面を見せないようにする
    appContainer.style.display = 'none';
  }

  const updatePinDisplay = () => {
    pinDots.forEach((dot, index) => {
      if (index < enteredPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });

    if (enteredPin.length === 4) {
      checkPin();
    }
  };

  const checkPin = () => {
    if (enteredPin === CORRECT_PIN) {
      // 成功時
      pinErrorMsg.classList.add('hidden');
      localStorage.setItem('nippou_auth_passed', 'true'); // 今後スキップ
      
      // ふわっと消えるアニメーション
      pinOverlay.style.opacity = '0';
      setTimeout(() => {
        pinOverlay.style.display = 'none';
        appContainer.style.display = 'block';
        // メイン画面のふわっと表示
        appContainer.style.animation = 'fadeIn 0.5s ease-out both';
      }, 500);
      
    } else {
      // 失敗時
      pinErrorMsg.classList.remove('hidden');
      enteredPin = '';
      
      // エラー表示にアニメーションを追加するため一度クラスを消して再度付与
      pinErrorMsg.style.animation = 'none';
      void pinErrorMsg.offsetWidth; // リフローを強制
      pinErrorMsg.style.animation = null;
      
      setTimeout(updatePinDisplay, 400); // 少し待ってからドットをクリア
    }
  };

  pinBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (enteredPin.length < 4) {
        enteredPin += btn.getAttribute('data-val');
        pinErrorMsg.classList.add('hidden');
        updatePinDisplay();
      }
    });
  });

  pinClearBtn.addEventListener('click', () => {
    if (enteredPin.length > 0) {
      enteredPin = enteredPin.slice(0, -1);
      pinErrorMsg.classList.add('hidden');
      updatePinDisplay();
    }
  });


  // --- フォーム送信・編集機能 ---
  const dateInput = document.getElementById('date');
  const timeInput = document.getElementById('time');
  const form = document.getElementById('nippouForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitSpinner = document.getElementById('submitSpinner');
  const submitIcon = document.getElementById('submitIcon');
  const messageEl = document.getElementById('message');
  
  const editRowInput = document.getElementById('editRow');
  const editActionInput = document.getElementById('editAction');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  // 日付と時刻の初期セット（アプリを開いた現在の時刻）
  const setCurrentDateTime = () => {
    // 担当者の初期セット
    const savedAuthor = localStorage.getItem('nippou_author');
    if (savedAuthor) {
      const authorRadio = document.querySelector(`input[name="author"][value="${savedAuthor}"]`);
      if (authorRadio) authorRadio.checked = true;
    }
    
    const now = new Date();
    
    // YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;

    // HH:MM
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
  };

  setCurrentDateTime();

  // 編集モードを終了して新規追加モードに戻る
  const resetToInsertMode = () => {
    editRowInput.value = '';
    editActionInput.value = 'insert';
    submitBtnText.textContent = '送信する';
    submitIcon.textContent = 'send';
    cancelEditBtn.classList.add('hidden');
    
    document.getElementById('client').value = '';
    document.getElementById('content').value = '';
    const radios = document.querySelectorAll('input[name="status"]');
    radios.forEach(r => r.checked = false);
    setCurrentDateTime();
  };

  cancelEditBtn.addEventListener('click', resetToInsertMode);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 送信ボタンを無効化してスピナーを表示
    submitBtn.disabled = true;
    submitBtnText.style.display = 'none';
    if(submitIcon) submitIcon.style.display = 'none';
    submitSpinner.style.display = 'block';
    
    messageEl.classList.add('hidden');
    messageEl.className = 'message hidden';
    
    // 入力データの取得
    const formData = new FormData(form);
    const action = formData.get('action'); // "insert" または "update"
    const row = formData.get('row');
    let date = formData.get('date');
    if (date) date = date.replace(/-/g, '/'); // YYYY-MM-DD フォーマットを YYYY/MM/DD に変換して送信する
    const time = formData.get('time');
    const client = formData.get('client');
    const status = formData.get('status');
    const author = formData.get('author');
    const baseContent = formData.get('content');

    // 担当者をローカルストレージに保存して次回以降自動選択
    if (author) localStorage.setItem('nippou_author', author);
    
    // 「担当者」と「状況タグ」を内容の末尾に足す (編集時は2重にならないように処理)
    let finalContent = baseContent.trim();
    
    // タグの除去（万が一含まれていた場合）
    if (finalContent.endsWith('[!]') || finalContent.endsWith('[#]')) {
      finalContent = finalContent.substring(0, finalContent.length - 3).trim();
    }
    // 担当者の除去（万が一含まれていた場合）
    const authorsList = ['社長', '伸明', '横澤'];
    for (const a of authorsList) {
      if (finalContent.endsWith(a)) {
        finalContent = finalContent.substring(0, finalContent.length - a.length).trim();
        break;
      }
    }
    
    finalContent = `${finalContent}\n${author} ${status}`;

    // POST用パラメータ作成
    const urlEncodedData = new URLSearchParams();
    urlEncodedData.append('action', action);
    if (row) urlEncodedData.append('row', row);
    urlEncodedData.append('date', date);
    urlEncodedData.append('time', time);
    urlEncodedData.append('client', client);
    urlEncodedData.append('content', finalContent);

    try {
      // GASへPOSTリクエストを送信
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: urlEncodedData.toString()
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        showMessage(action === 'update' ? '日報を訂正（上書き）しました！' : '日報を送信しました！', 'success');
        resetToInsertMode();
        
        // もし検索中なら自動で再検索する
        if (searchResultsEl.innerHTML.trim() !== '' && searchInput.value.trim() !== '') {
          searchForm.dispatchEvent(new Event('submit'));
        }
      } else {
        throw new Error(result.message || '送信に失敗しました');
      }

    } catch (error) {
      console.error('Error:', error);
      showMessage('送信に失敗しました。', 'error');
    } finally {
      // ボタンの状態を元に戻す
      submitBtn.disabled = false;
      submitBtnText.style.display = 'block';
      if(submitIcon) submitIcon.style.display = 'block';
      submitSpinner.style.display = 'none';
    }
  });

  // メッセージ表示用関数
  function showMessage(msg, type) {
    messageEl.textContent = msg;
    messageEl.classList.add(type);
    messageEl.classList.remove('hidden');
    
    if (type === 'success') {
      setTimeout(() => {
        messageEl.classList.add('hidden');
      }, 5000);
    }
  }

  // --- 検索機能 ---
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchBtnText = searchBtn.querySelector('.btn-text');
  const searchSpinner = searchBtn.querySelector('.search-spinner');
  const searchResultsEl = document.getElementById('searchResults');
  
  const searchProgressBtn = document.getElementById('searchProgressBtn');
  const searchTodayBtn = document.getElementById('searchTodayBtn');
  const searchCalendarBtn = document.getElementById('searchCalendarBtn');
  const searchDateInput = document.getElementById('searchDateInput');

  // 継続中検索ボタンのイベント
  if (searchProgressBtn) {
    searchProgressBtn.addEventListener('click', () => {
      searchInput.value = '[#]';
      // 自動で検索を実行
      searchForm.dispatchEvent(new Event('submit'));
    });
  }

  // 当日検索ボタンのイベント
  if (searchTodayBtn) {
    searchTodayBtn.addEventListener('click', () => {
      const now = new Date();
      // YYYY/MM/DDの形式に整形
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      
      searchInput.value = `${y}/${m}/${d}`;
      // 自動で検索を実行
      searchForm.dispatchEvent(new Event('submit'));
    });
  }

  // カレンダー入力のイベント（日付が選択されたら自動入力して検索）
  if (searchDateInput) {
    searchDateInput.addEventListener('change', (e) => {
      const val = e.target.value; // YYYY-MM-DD
      if (val) {
        searchInput.value = val.replace(/-/g, '/'); // 検索形式は YYYY/MM/DD
        // 自動で検索を実行
        searchForm.dispatchEvent(new Event('submit'));
        // 連続使用のために一度リセットしておく
        e.target.value = '';
      }
    });
  }

  // 日付文字列を YYYY/MM/DD に整形
  function formatDateString(val) {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    } catch(e) {
      return String(val);
    }
  }

  // 時刻文字列を HH:MM に整形（GASでのDate型などから）
  function formatTimeString(val) {
    if (!val) return '';
    if (typeof val === 'string' && val.includes(':')) {
      if (val.includes('T')) {
        const timePart = val.split('T')[1].split(':');
        return `${timePart[0]}:${timePart[1]}`;
      }
      return val.substring(0, 5);
    }
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch(e) {
      return String(val);
    }
  }

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let keyword = searchInput.value.trim();
    if (!keyword) return;

    // UI状態更新：検索中
    searchBtn.disabled = true;
    searchBtnText.style.display = 'none';
    searchSpinner.style.display = 'block';
    searchResultsEl.innerHTML = '';

    try {
      // GASへGETリクエスト（CORS対策としてfetchを使用しパラメータを付与）
      const response = await fetch(`${GAS_URL}?keyword=${encodeURIComponent(keyword)}`);
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const data = await response.json();
      
      if (data.status === 'success') {
        renderSearchResults(data.results);
      } else {
        throw new Error(data.message || '検索に失敗しました');
      }
    } catch (error) {
      console.error('Search Error:', error);
      searchResultsEl.innerHTML = `<div class="no-results" style="color: #991B1B;">エラーが発生しました: ${error.message}</div>`;
    } finally {
      searchBtn.disabled = false;
      searchBtnText.style.display = 'block';
      searchSpinner.style.display = 'none';
    }
  });

  function renderSearchResults(results) {
    if (!results || results.length === 0) {
      searchResultsEl.innerHTML = '<div class="no-results fade-in"><span class="material-symbols-rounded icon-md">search_off</span>検索結果が見つかりませんでした。</div>';
      return;
    }

    // 新しいものが上に来るように逆順
    const html = results.reverse().map((result, index) => {
      // resultにはGAS側から `row` が渡される前提
      const rowId = result.row || '';
      
      const dateStr = formatDateString(result.date) || '日付なし';
      const timeStr = formatTimeString(result.time) || '';
      const animDelay = (index * 0.05).toFixed(2);
      
      // HTML属性用のエスケープ処理（改行やダブルクォーテーション対応）
      const escapeHtmlAttr = (str) => {
        if (!str) return '';
        return String(str)
          .replace(/"/g, '&quot;')
          .replace(/\n/g, '&#10;')
          .replace(/\r/g, '&#13;');
      };
      
      // 継続中タグの判定
      const hasProgressTag = (result.content || '').includes('[#]');
      const cardClass = hasProgressTag ? 'result-card border-progress fade-in' : 'result-card fade-in';
      
      return `
        <div class="${cardClass}" style="animation-delay: ${animDelay}s">
          <div class="result-header">
            <div class="result-datetime">
              <span class="material-symbols-rounded icon-xs">calendar_clock</span>
              <span>${dateStr} ${timeStr}</span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              ${rowId && hasProgressTag ? `<button type="button" class="done-btn" data-row="${rowId}" data-date="${escapeHtmlAttr(result.date)}" data-time="${escapeHtmlAttr(result.time)}" data-client="${escapeHtmlAttr(result.client)}" data-content="${escapeHtmlAttr(result.content)}"><span class="material-symbols-rounded icon-xs">check_circle</span>完了</button>` : ''}
              ${rowId ? `<button type="button" class="edit-btn" data-row="${rowId}" data-date="${escapeHtmlAttr(result.date)}" data-time="${escapeHtmlAttr(result.time)}" data-client="${escapeHtmlAttr(result.client)}" data-content="${escapeHtmlAttr(result.content)}"><span class="material-symbols-rounded icon-xs">edit</span>訂正</button>` : ''}
            </div>
          </div>
          <div class="result-client">
            <span class="material-symbols-rounded icon-sm">person</span>
            ${result.client || '（得意先情報なし）'}
          </div>
          <div class="result-content">${result.content || ''}</div>
        </div>
      `;
    }).join('');

    searchResultsEl.innerHTML = html;
  }
  
  // 訂正・完了ボタンのクリックイベント（イベントデリゲーション）
  searchResultsEl.addEventListener('click', async (e) => {
    // --- 完了ボタン処理 ---
    const doneBtn = e.target.closest('.done-btn');
    if (doneBtn) {
      if (!confirm('この日報を完了に変更しますか？')) return;
      
      const rowId = doneBtn.getAttribute('data-row');
      const dateVal = formatDateString(doneBtn.getAttribute('data-date')); // YYYY/MM/DDに整形
      const timeVal = formatTimeString(doneBtn.getAttribute('data-time'));
      const clientVal = doneBtn.getAttribute('data-client') || '';
      let contentVal = doneBtn.getAttribute('data-content') || '';
      
      // コンテンツ内の[#]を[!]に置き換える
      contentVal = contentVal.replace(/\[#\]/g, '[!]');
      
      // スピナー表示（ボタンの見た目変更）
      const originalText = doneBtn.innerHTML;
      doneBtn.innerHTML = '<span class="material-symbols-rounded icon-xs">sync</span>更新中';
      doneBtn.disabled = true;
      
      try {
        const urlEncodedData = new URLSearchParams();
        urlEncodedData.append('action', 'update');
        urlEncodedData.append('row', rowId);
        urlEncodedData.append('date', dateVal);
        urlEncodedData.append('time', timeVal);
        urlEncodedData.append('client', clientVal);
        urlEncodedData.append('content', contentVal);

        const response = await fetch(GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: urlEncodedData.toString()
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const result = await response.json();
        
        if (result.status === 'success') {
          showMessage('日報を完了状態に変更しました！', 'success');
          // 自動で現在の検索ワードで再検索して画面を更新
          searchForm.dispatchEvent(new Event('submit'));
        } else {
          throw new Error(result.message || '更新に失敗しました');
        }
      } catch (err) {
        console.error(err);
        showMessage('完了の更新に失敗しました。', 'error');
        doneBtn.innerHTML = originalText;
        doneBtn.disabled = false;
      }
      return;
    }

    // --- 訂正ボタン処理 ---
    const btn = e.target.closest('.edit-btn');
    if (!btn) return;
    
    const rowId = btn.getAttribute('data-row');
    const dateVal = btn.getAttribute('data-date');
    const timeVal = btn.getAttribute('data-time');
    const clientVal = btn.getAttribute('data-client');
    const contentVal = btn.getAttribute('data-content');
    
    startEditing(rowId, dateVal, timeVal, clientVal, contentVal);
  });

  // 編集開始用関数
  const startEditing = (rowId, dateVal, timeVal, clientVal, contentVal) => {
    // フォームまでスクロール
    document.querySelector('.glass-header').scrollIntoView({ behavior: 'smooth' });
    
    // 値のセット
    editRowInput.value = rowId;
    editActionInput.value = 'update';
    
    // 日付 (YYYY-MM-DDに直してセット)
    let ymd = dateVal || '';
    if(ymd.includes('/')) ymd = ymd.replace(/\//g, '-');
    dateInput.value = ymd;
    
    // 時刻
    timeInput.value = formatTimeString(timeVal);
    
    const clientInput = document.getElementById('client');
    clientInput.value = clientVal || '';
    
    // コンテンツとタグ・担当者の分離
    let rawContent = contentVal || '';
    let foundTag = false;
    const radiosStatus = document.querySelectorAll('input[name="status"]');
    const radiosAuthor = document.querySelectorAll('input[name="author"]');
    
    // 改行などの余分な空白を削除してからタグ判定
    rawContent = rawContent.trim();
    
    if (rawContent.endsWith('[!]')) {
      radiosStatus.forEach(r => { if(r.value === '[!]') r.checked = true; });
      rawContent = rawContent.substring(0, rawContent.length - 3).trim();
      foundTag = true;
    } else if (rawContent.endsWith('[#]')) {
      radiosStatus.forEach(r => { if(r.value === '[#]') r.checked = true; });
      rawContent = rawContent.substring(0, rawContent.length - 3).trim();
      foundTag = true;
    }
    
    // 担当者の抜き出し
    const authors = ['社長', '伸明', '横澤'];
    let foundAuthor = false;
    if (foundTag) {
      for (const a of authors) {
        if (rawContent.endsWith(a)) {
          radiosAuthor.forEach(r => { if(r.value === a) r.checked = true; });
          rawContent = rawContent.substring(0, rawContent.length - a.length).trim();
          foundAuthor = true;
          break;
        }
      }
    }
    
    // もしタグが見つからなかったら一度ラジオボタンのチェックを外す
    if(!foundTag) {
      radiosStatus.forEach(r => r.checked = false);
    }
    
    document.getElementById('content').value = rawContent;
    
    // ボタンの見た目を変える
    submitBtnText.textContent = '更新する';
    submitIcon.textContent = 'save';
    cancelEditBtn.classList.remove('hidden');
    
    // 少しハイライトアニメーション
    form.style.transform = 'scale(1.02)';
    setTimeout(()=> { form.style.transform = 'scale(1)'; }, 200);
  };
});
