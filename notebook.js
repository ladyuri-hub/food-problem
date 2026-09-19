/**
 * 공포의 부엌: 수업용 영양 탐정 수첩 (학습지 마스터시트)
 * 중1 기술·가정 식생활 문제 요약 및 학습지 정리용 모듈
 */

class NutritionNotebook {
  constructor() {
    this.viewMode = 'table'; // 'table' | 'cards'
    this.forceShowAll = false; // 교사용 전체보기 토글
    this.clearedStatus = {
      fridge: false,
      mirror: false,
      cauldron: false,
      shelf: false,
      door: false
    };
  }

  updateStatus(clearedMap) {
    if (clearedMap) {
      this.clearedStatus = { ...this.clearedStatus, ...clearedMap };
    }
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'table' ? 'cards' : 'table';
    this.render();
  }

  toggleForceShowAll() {
    this.forceShowAll = !this.forceShowAll;
    this.render();
  }

  copyWorksheetText() {
    let text = "========================================================\n";
    text += "[수업 학습지 정리] 공포의 부엌: 중1 청소년 식생활 문제 완전정복\n";
    text += "========================================================\n\n";

    WORKSHEET_MASTER_DATA.forEach(item => {
      text += `[${item.num}] 구역: ${item.area} | 핵심 주제: ${item.topic.replace('\n', ' ')}\n`;
      text += `▶ 원인: ${item.cause}\n`;
      text += `▶ 미치는 악영향: ${item.impact.replace(/\n/g, ' ')}\n`;
      text += `▶ 해결 방안 & 건강 식품: ${item.solution}\n`;
      text += "--------------------------------------------------------\n";
    });

    text += "\n★ 청소년 식생활 실천 약속: 하루 3끼 규칙적 식사, 물 1.5L 이상 섭취, 패스트푸드 줄이기!";

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert("📋 학습지 전체 요약 텍스트가 클립보드에 복사되었습니다!\n한글(HWP)이나 메모장에 [Ctrl+V]로 붙여넣으세요.");
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert("📋 학습지 전체 요약 텍스트가 클립보드에 복사되었습니다!\n한글(HWP)이나 메모장에 [Ctrl+V]로 붙여넣으세요.");
  }

  render(containerId = 'notebook-content-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = `
      <div class="worksheet-toolbar">
        <div class="toolbar-left">
          <button id="btn-toggle-view" class="tool-btn ${this.viewMode === 'table' ? 'active' : ''}">
            ${this.viewMode === 'table' ? '📊 표 형식 (학습지)' : '🗂️ 카드 형식 (수첩)'}
          </button>
          <button id="btn-force-show-all" class="tool-btn ${this.forceShowAll ? 'tool-btn-warning' : ''}">
            ${this.forceShowAll ? '👁️ 전체 정답 보기 ON' : '🔒 탐색 완료분만 보기'}
          </button>
        </div>
        <div class="toolbar-right">
          <button id="btn-copy-worksheet" class="tool-btn tool-btn-primary">
            📋 텍스트 전체 복사 (학습지용)
          </button>
        </div>
      </div>
    `;

    if (this.viewMode === 'table') {
      html += this.renderTableView();
    } else {
      html += this.renderCardsView();
    }

    container.innerHTML = html;

    // 이벤트 리스너 바인딩
    const btnToggleView = document.getElementById('btn-toggle-view');
    if (btnToggleView) {
      btnToggleView.onclick = () => this.toggleViewMode();
    }

    const btnForce = document.getElementById('btn-force-show-all');
    if (btnForce) {
      btnForce.onclick = () => this.toggleForceShowAll();
    }

    const btnCopy = document.getElementById('btn-copy-worksheet');
    if (btnCopy) {
      btnCopy.onclick = () => this.copyWorksheetText();
    }
  }

  renderTableView() {
    const areaKeyMap = { 1: 'fridge', 2: 'mirror', 3: 'cauldron', 4: 'shelf', 5: 'door' };

    let rows = WORKSHEET_MASTER_DATA.map(item => {
      const areaKey = areaKeyMap[item.num];
      const isUnlocked = this.forceShowAll || this.clearedStatus[areaKey];

      const statusBadge = isUnlocked
        ? '<span class="status-badge badge-cleared">정화 완료 ✓</span>'
        : '<span class="status-badge badge-locked">미탐색 🔒</span>';

      const causeContent = isUnlocked ? item.cause : '<span class="text-blurred">단서를 정화하면 기록됩니다</span>';
      const impactContent = isUnlocked ? item.impact.replace(/\n/g, '<br>') : '<span class="text-blurred">단서를 정화하면 기록됩니다</span>';
      const solutionContent = isUnlocked ? item.solution : '<span class="text-blurred">단서를 정화하면 기록됩니다</span>';

      return `
        <tr class="${isUnlocked ? 'row-unlocked' : 'row-locked'}">
          <td class="col-num">${item.num}</td>
          <td class="col-area">
            <strong>${item.area}</strong>
            <br>${statusBadge}
          </td>
          <td class="col-topic"><strong>${item.topic.replace(/\n/g, '<br>')}</strong></td>
          <td class="col-cause">${causeContent}</td>
          <td class="col-impact">${impactContent}</td>
          <td class="col-solution">${solutionContent}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="table-responsive">
        <table class="worksheet-summary-table">
          <thead>
            <tr>
              <th style="width: 5%;">번호</th>
              <th style="width: 15%;">탐색 구역</th>
              <th style="width: 15%;">식생활 핵심 문제</th>
              <th style="width: 20%;">발생 원인</th>
              <th style="width: 25%;">청소년기 악영향</th>
              <th style="width: 20%;">해결 방안 & 건강 식품</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  renderCardsView() {
    const keys = ['fridge', 'mirror', 'cauldron', 'shelf', 'door'];
    const cards = keys.map(key => {
      const area = KITCHEN_AREAS[key];
      const isUnlocked = this.forceShowAll || this.clearedStatus[key];
      const sum = area.notebookSummary;

      return `
        <div class="notebook-card ${isUnlocked ? 'card-unlocked' : 'card-locked'}">
          <div class="card-header">
            <span class="card-icon">${area.icon}</span>
            <div class="card-title-group">
              <h4 class="card-title">${area.name}</h4>
              <span class="card-subtitle">${sum.topic}</span>
            </div>
            <span class="card-status-pill">${isUnlocked ? '정화 완료 ✨' : '잠김 🔒'}</span>
          </div>
          <div class="card-body">
            <div class="card-row">
              <strong class="row-label">❓ 왜 발생할까? (원인)</strong>
              <p class="row-text">${isUnlocked ? sum.cause : '<span class="text-blurred">비밀 단서가 잠겨 있습니다.</span>'}</p>
            </div>
            <div class="card-row">
              <strong class="row-label">⚠️ 우리 몸에 미치는 영향</strong>
              <p class="row-text">${isUnlocked ? sum.impact : '<span class="text-blurred">비밀 단서가 잠겨 있습니다.</span>'}</p>
            </div>
            <div class="card-row highlight-row">
              <strong class="row-label">🥗 올바른 해결과 실천</strong>
              <p class="row-text">${isUnlocked ? sum.solution : '<span class="text-blurred">비밀 단서가 잠겨 있습니다.</span>'}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `<div class="notebook-cards-grid">${cards}</div>`;
  }
}

window.NutritionNotebook = NutritionNotebook;
