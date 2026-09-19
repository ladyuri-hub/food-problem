/**
 * 공포의 부엌: 청소년 식생활 탈출기 - 메인 게임 엔진
 * 중학교 1학년 기술·가정 연계 방탈출 웹 게임
 */

class EscapeRoomGame {
  constructor() {
    this.totalTime = 60; // 1분 타임어택 (60초)
    this.timeRemaining = 60;
    this.sanity = 100;
    this.timerInterval = null;
    this.isGameOver = false;
    this.isGameCleared = false;
    this.gameStartTime = null;

    this.currentAreaId = null;
    this.currentStepIndex = 0; // 0: 1단계(개념/심화), 1: 2단계(식품실천)
    this.selectedOptionIndex = null;

    this.areas = JSON.parse(JSON.stringify(KITCHEN_AREAS));
    this.audio = new HorrorAudioSystem();
    this.notebook = new NutritionNotebook();

    this.leaderboard = this.loadLeaderboard();
  }

  init() {
    this.bindEvents();
    this.renderInventory();
    this.updateHUD();
  }

  loadLeaderboard() {
    try {
      const stored = localStorage.getItem('horror_kitchen_leaderboard');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(e);
    }
    // 기본 모범 기록 (중학교 1학년 학생 예시)
    return [
      { name: '1-2 김영양', time: 41, date: '2026-09-18' },
      { name: '1-3 이수업', time: 48, date: '2026-09-18' },
      { name: '1-1 박가정', time: 54, date: '2026-09-19' }
    ];
  }

  saveLeaderboard(record) {
    this.leaderboard.push(record);
    this.leaderboard.sort((a, b) => a.time - b.time);
    if (this.leaderboard.length > 10) {
      this.leaderboard = this.leaderboard.slice(0, 10);
    }
    try {
      localStorage.setItem('horror_kitchen_leaderboard', JSON.stringify(this.leaderboard));
    } catch (e) {
      console.warn(e);
    }
  }

  bindEvents() {
    // 인트로 모달 시작 버튼
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.startGame();
      });
    }

    // 소리 토글 버튼
    const btnSound = document.getElementById('btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        btnSound.textContent = isMuted ? '🔇 음소거 해제' : '🔊 사운드 ON';
        btnSound.classList.toggle('muted', isMuted);
      });
    }

    // 학습지 수첩 열기 버튼 (상단 HUD)
    const btnNotebook = document.getElementById('btn-open-notebook');
    if (btnNotebook) {
      btnNotebook.addEventListener('click', () => {
        this.openNotebookModal();
      });
    }

    // 수첩 모달 닫기
    const btnCloseNotebook = document.getElementById('btn-close-notebook');
    if (btnCloseNotebook) {
      btnCloseNotebook.addEventListener('click', () => {
        this.closeNotebookModal();
      });
    }

    // 퍼즐 모달 닫기
    const btnClosePuzzle = document.getElementById('btn-close-puzzle');
    if (btnClosePuzzle) {
      btnClosePuzzle.addEventListener('click', () => {
        this.closePuzzleModal();
      });
    }

    // 부엌 핫스팟 클릭 이벤트
    const hotspots = document.querySelectorAll('.kitchen-hotspot');
    hotspots.forEach(hotspot => {
      hotspot.addEventListener('click', (e) => {
        const areaId = e.currentTarget.dataset.area;
        this.handleHotspotClick(areaId);
      });
    });

    // 재시작 버튼들
    const restartBtns = document.querySelectorAll('.btn-restart-game');
    restartBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.restartGame();
      });
    });

    // 엔딩 창에서 학습지 열기 버튼
    const btnEndingNotebook = document.getElementById('btn-ending-notebook');
    if (btnEndingNotebook) {
      btnEndingNotebook.addEventListener('click', () => {
        this.openNotebookModal(true);
      });
    }
  }

  startGame() {
    const introModal = document.getElementById('modal-intro');
    if (introModal) {
      introModal.classList.add('hidden');
    }

    this.audio.startAmbient();
    this.gameStartTime = Date.now();
    this.startTimer();
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.isGameOver || this.isGameCleared) {
        clearInterval(this.timerInterval);
        return;
      }

      this.timeRemaining--;
      this.updateTimerDisplay();

      // 15초 이하일 때 경고 효과
      if (this.timeRemaining <= 15) {
        const timerEl = document.getElementById('timer-display');
        if (timerEl) timerEl.classList.add('urgent');
        this.audio.triggerTension(this.timeRemaining);
      }

      // 시간 초과 (1분 만료)
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.updateTimerDisplay();
        clearInterval(this.timerInterval);
        this.triggerGameOver('TIME_OVER');
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById('timer-seconds');
    if (timerEl) {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      timerEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
  }

  updateHUD() {
    this.updateTimerDisplay();

    // 정신력 바
    const sanityBar = document.getElementById('sanity-bar-fill');
    const sanityText = document.getElementById('sanity-val');
    if (sanityBar) {
      sanityBar.style.width = `${this.sanity}%`;
      if (this.sanity <= 30) {
        sanityBar.classList.add('critical');
      } else {
        sanityBar.classList.remove('critical');
      }
    }
    if (sanityText) {
      sanityText.textContent = `${this.sanity}%`;
    }
  }

  renderInventory() {
    const container = document.getElementById('inventory-slots');
    if (!container) return;

    const areaKeys = ['fridge', 'mirror', 'cauldron', 'shelf', 'door'];
    container.innerHTML = areaKeys.map(key => {
      const area = this.areas[key];
      const isCleared = area.cleared;
      return `
        <div class="talisman-slot ${isCleared ? 'filled' : 'empty'}" title="${isCleared ? area.talisman : '미획득 부적'}">
          <span class="slot-icon">${isCleared ? area.icon : '🔒'}</span>
          <span class="slot-label">${isCleared ? area.talisman.split(' ')[0] : '미획득'}</span>
        </div>
      `;
    }).join('');
  }

  handleHotspotClick(areaId) {
    if (this.isGameOver || this.isGameCleared) return;

    const area = this.areas[areaId];
    if (!area) return;

    // 이미 정화된 구역인 경우
    if (area.cleared) {
      this.audio.playSanctuary();
      alert(`✨ [${area.name}]은(는) 이미 정화되었습니다!\n획득 부적: ${area.talisman}\n상세 내용은 [수업 내용 정리]에서 확인할 수 있습니다.`);
      return;
    }

    // 탈출문(door)인 경우 4개 부적 선행 조건 체크
    if (areaId === 'door') {
      const nonDoorCleared = ['fridge', 'mirror', 'cauldron', 'shelf'].every(id => this.areas[id].cleared);
      if (!nonDoorCleared) {
        this.audio.playWrong();
        alert('⛓️ [사슬로 봉인된 탈출문]\n부엌 곳곳에 도사린 4가지 저주(냉장고, 거울, 가마솥, 선반)를 먼저 모두 정화해야 쇠사슬을 풀 수 있습니다!');
        return;
      }
    }

    // 구역 퍼즐 시작
    this.currentAreaId = areaId;
    this.currentStepIndex = 0; // 1단계부터 시작
    this.openPuzzleModal();
  }

  openPuzzleModal() {
    const area = this.areas[this.currentAreaId];
    if (!area) return;

    const modal = document.getElementById('modal-puzzle');
    const titleEl = document.getElementById('puzzle-modal-title');
    const problemDescEl = document.getElementById('puzzle-problem-desc');

    if (titleEl) titleEl.innerHTML = `${area.icon} ${area.name} <span class="problem-tag">${area.problem}</span>`;
    if (problemDescEl) problemDescEl.textContent = area.shortDesc;

    this.renderQuestionStepView();

    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  closePuzzleModal() {
    const modal = document.getElementById('modal-puzzle');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.currentAreaId = null;
    this.currentStepIndex = 0;
  }

  renderQuestionStepView() {
    const area = this.areas[this.currentAreaId];
    if (!area) return;

    const question = area.questions[this.currentStepIndex];
    if (!question) return;

    // 단계 탭 네비게이션
    const navContainer = document.getElementById('quiz-step-nav');
    if (navContainer) {
      navContainer.innerHTML = `
        <div class="step-pill ${this.currentStepIndex === 0 ? 'active' : (this.currentStepIndex > 0 ? 'completed' : '')}">
          1단계: 원인 및 위험성 심화 탐구 ${this.currentStepIndex > 0 ? '✓' : ''}
        </div>
        <div class="step-divider">➔</div>
        <div class="step-pill ${this.currentStepIndex === 1 ? 'active' : ''}">
          2단계: 건강 식품 실천 & 정화 부적
        </div>
      `;
    }

    // 질문 및 선택지
    const promptEl = document.getElementById('quiz-prompt-text');
    if (promptEl) {
      promptEl.innerHTML = `<strong>Q${this.currentStepIndex + 1}.</strong> ${question.prompt}`;
    }

    const optionsContainer = document.getElementById('quiz-options-container');
    if (optionsContainer) {
      optionsContainer.innerHTML = question.options.map((opt, idx) => `
        <button class="choice-option-btn" data-index="${idx}">
          <span class="choice-num">${['①', '②', '③', '④'][idx]}</span>
          <span class="choice-text">${opt.text}</span>
        </button>
      `).join('');

      // 옵션 클릭 이벤트 연결
      const optionBtns = optionsContainer.querySelectorAll('.choice-option-btn');
      optionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.index, 10);
          this.handleOptionSelect(idx);
        });
      });
    }

    // 피드백 영역 초기화
    const feedbackBox = document.getElementById('quiz-feedback-box');
    if (feedbackBox) {
      feedbackBox.className = 'quiz-feedback hidden';
      feedbackBox.innerHTML = '';
    }
  }

  handleOptionSelect(optionIndex) {
    const area = this.areas[this.currentAreaId];
    if (!area) return;

    const question = area.questions[this.currentStepIndex];
    const option = question.options[optionIndex];
    const isCorrect = option.correct;

    const feedbackBox = document.getElementById('quiz-feedback-box');
    const optionBtns = document.querySelectorAll('.choice-option-btn');

    // 선택지 스타일 업데이트
    optionBtns.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === optionIndex) {
        btn.classList.add(isCorrect ? 'correct-choice' : 'incorrect-choice');
      }
      if (!isCorrect && question.options[idx].correct) {
        btn.classList.add('answer-reveal');
      }
    });

    if (isCorrect) {
      this.audio.playPurify();
      feedbackBox.className = 'quiz-feedback feedback-correct';

      if (this.currentStepIndex === 0) {
        // 1단계 통과 -> 2단계 이동 버튼
        feedbackBox.innerHTML = `
          <div class="feedback-icon">🎉</div>
          <div class="feedback-text">
            <strong>[1단계 통과]</strong> ${question.feedback.correct}
          </div>
          <button id="btn-next-step" class="btn-step-action">
            ▶ 2단계(건강 식품 실천 & 정화) 도전하기
          </button>
        `;
        const btnNext = document.getElementById('btn-next-step');
        if (btnNext) {
          btnNext.addEventListener('click', () => {
            this.currentStepIndex = 1;
            this.renderQuestionStepView();
          });
        }
      } else {
        // 2단계 통과 -> 해당 구역 정화 완료 및 부적 획득!
        area.cleared = true;
        this.renderInventory();
        this.updateNotebookStatus();

        feedbackBox.innerHTML = `
          <div class="feedback-icon">✨</div>
          <div class="feedback-text">
            <strong>[정화 완료!]</strong> ${question.feedback.correct}
            <div class="talisman-reward-box">
              획득: <strong>${area.talisman}</strong>
            </div>
          </div>
          <button id="btn-finish-area" class="btn-step-action btn-gold">
            ${this.currentAreaId === 'door' ? '🏆 영양 마스터 부엌 탈출문 열기!' : '주방으로 돌아가기'}
          </button>
        `;

        const btnFinish = document.getElementById('btn-finish-area');
        if (btnFinish) {
          btnFinish.addEventListener('click', () => {
            this.closePuzzleModal();

            // 만약 탈출문(door)까지 정화되었다면 게임 클리어!
            if (this.currentAreaId === 'door' || Object.values(this.areas).every(a => a.cleared)) {
              this.triggerGameClear();
            }
          });
        }
      }
    } else {
      // 오답 처리
      this.audio.playWrong();
      this.sanity = Math.max(0, this.sanity - 20);
      this.updateHUD();

      feedbackBox.className = 'quiz-feedback feedback-incorrect';
      feedbackBox.innerHTML = `
        <div class="feedback-icon">⚠️</div>
        <div class="feedback-text">
          <strong>[오답 / 경고!]</strong> ${question.feedback.incorrect}
          <div class="sanity-warning-text">정신력 -20% 감소! (남은 정신력: ${this.sanity}%)</div>
        </div>
        <button id="btn-retry-step" class="btn-step-action btn-retry">
          🔄 다시 생각해보고 재도전하기
        </button>
      `;

      if (this.sanity <= 0) {
        setTimeout(() => {
          this.closePuzzleModal();
          this.triggerGameOver('SANITY_DEPLETED');
        }, 1200);
        return;
      }

      const btnRetry = document.getElementById('btn-retry-step');
      if (btnRetry) {
        btnRetry.addEventListener('click', () => {
          this.renderQuestionStepView();
        });
      }
    }
  }

  updateNotebookStatus() {
    const statusMap = {};
    Object.keys(this.areas).forEach(key => {
      statusMap[key] = this.areas[key].cleared;
    });
    this.notebook.updateStatus(statusMap);
  }

  triggerGameOver(reason) {
    this.isGameOver = true;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.audio.playGameOver();

    const modal = document.getElementById('modal-game-over');
    const reasonText = document.getElementById('game-over-reason');

    if (reason === 'TIME_OVER') {
      reasonText.textContent = '1분 제한 시간이 종료되었습니다! 정크푸드 악령의 저주로 부엌 문이 영원히 닫혔습니다.';
    } else {
      reasonText.textContent = '정신력(Sanity)이 고갈되었습니다! 잘못된 식생활 망령에게 삼켜지고 말았습니다.';
    }

    if (modal) modal.classList.remove('hidden');
  }

  triggerGameClear() {
    this.isGameCleared = true;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.audio.playFanfare();

    const elapsedSeconds = this.totalTime - this.timeRemaining;
    const modal = document.getElementById('modal-clear');

    const clearTimeEl = document.getElementById('clear-time-text');
    if (clearTimeEl) {
      clearTimeEl.textContent = `${elapsedSeconds}초 만에 탈출 성공! (남은 시간: ${this.timeRemaining}초)`;
    }

    this.renderLeaderboardUI(elapsedSeconds);

    if (modal) modal.classList.remove('hidden');
  }

  renderLeaderboardUI(currentRecordTime) {
    const listContainer = document.getElementById('leaderboard-list');
    if (!listContainer) return;

    listContainer.innerHTML = this.leaderboard.map((item, idx) => `
      <li class="leaderboard-item rank-${idx + 1}">
        <span class="rank-badge">${idx + 1}등</span>
        <span class="player-name">${item.name}</span>
        <span class="record-time">${item.time}초</span>
      </li>
    `).join('');

    // 신규 등록 폼 이벤트 바인딩
    const btnSubmit = document.getElementById('btn-submit-name');
    const inputName = document.getElementById('input-player-name');
    if (btnSubmit && inputName) {
      btnSubmit.onclick = () => {
        const nameVal = inputName.value.trim();
        if (!nameVal) {
          alert('학번과 이름을 입력해주세요! (예: 1학년 2반 홍길동)');
          return;
        }
        this.saveLeaderboard({
          name: nameVal,
          time: currentRecordTime,
          date: new Date().toISOString().split('T')[0]
        });
        inputName.disabled = true;
        btnSubmit.disabled = true;
        btnSubmit.textContent = '등록 완료 ✓';
        this.renderLeaderboardUI(currentRecordTime);
      };
    }
  }

  openNotebookModal(fromEnding = false) {
    this.updateNotebookStatus();
    if (fromEnding) {
      this.notebook.forceShowAll = true; // 엔딩 시 전면 공개 기본값
    }
    this.notebook.render('notebook-content-container');
    const modal = document.getElementById('modal-notebook');
    if (modal) modal.classList.remove('hidden');
  }

  closeNotebookModal() {
    const modal = document.getElementById('modal-notebook');
    if (modal) modal.classList.add('hidden');
  }

  restartGame() {
    window.location.reload();
  }
}

// 전역 실행 인스턴스
window.addEventListener('DOMContentLoaded', () => {
  window.game = new EscapeRoomGame();
  window.game.init();
});
