/**
 * FlowTodo - Premium & Modern To-Do List Application
 * Core Logic & Interactive Functions
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. STATE MANAGEMENT (상태 관리)
  // ==========================================================================
  let todos = JSON.parse(localStorage.getItem('flowtodo_list')) || [];
  let currentFilter = 'all'; // 'all', 'active', 'completed'
  let currentTheme = localStorage.getItem('flowtodo_theme') || 'light';

  // ==========================================================================
  // 2. DOM ELEMENTS (DOM 요소 참조)
  // ==========================================================================
  const htmlDoc = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');
  
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');
  const emptyState = document.getElementById('empty-state');
  
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const progressCount = document.getElementById('progress-count');
  
  const filterNav = document.querySelector('.filter-nav');
  const filterTabs = document.querySelectorAll('.filter-tab');

  // ==========================================================================
  // 3. INITIALIZATION (초기화)
  // ==========================================================================
  function init() {
    // 테마 설정 복원
    setTheme(currentTheme);
    
    // 할 일 렌더링 및 진행 상황 업데이트
    renderTodos();
    updateProgress();
    
    // 이벤트 리스너 바인딩
    bindEvents();
  }

  // ==========================================================================
  // 4. EVENT BINDING (이벤트 바인딩)
  // ==========================================================================
  function bindEvents() {
    // 테마 토글 버튼 클릭
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // 할 일 추가 폼 제출
    todoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = todoInput.value.trim();
      if (text) {
        addTodo(text);
        todoInput.value = '';
        todoInput.focus();
      }
    });

    // 필터 탭 클릭 이벤트
    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const filterValue = e.target.getAttribute('data-filter');
        changeFilter(filterValue, e.target);
      });
    });

    // 할 일 목록 클릭 이벤트 위임 (체크박스 토글 / 삭제 버튼)
    todoList.addEventListener('click', (e) => {
      const todoItem = e.target.closest('.todo-item');
      if (!todoItem) return;
      
      const id = parseInt(todoItem.getAttribute('data-id'), 10);

      // 1. 체크박스 또는 내용 영역을 누르면 토글 처리
      if (e.target.closest('.todo-content') || e.target.closest('.custom-checkbox')) {
        toggleTodo(id);
      } 
      // 2. 삭제 버튼을 누르면 삭제 처리
      else if (e.target.closest('.delete-btn')) {
        deleteTodo(id, todoItem);
      }
    });
  }

  // ==========================================================================
  // 5. TO-DO CRUD FUNCTIONS (할 일 관리 핵심 비즈니스 로직)
  // ==========================================================================

  // 할 일 추가
  function addTodo(text) {
    const newTodo = {
      id: Date.now(), // 고유 ID 생성
      text: text,
      completed: false
    };
    
    todos.unshift(newTodo); // 최신 등록 건을 맨 앞으로 추가
    saveToLocalStorage();
    
    // 만약 현재 완료됨 필터가 켜져 있으면, 추가된 항목이 보이도록 전체 필터로 이동
    if (currentFilter === 'completed') {
      const allTab = document.getElementById('filter-all');
      changeFilter('all', allTab);
    } else {
      renderTodos();
    }
    
    updateProgress();
  }

  // 할 일 상태 토글
  function toggleTodo(id) {
    todos = todos.map(todo => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    
    saveToLocalStorage();
    renderTodos();
    updateProgress();
  }

  // 할 일 삭제 (애니메이션 완료 후 물리 제거)
  function deleteTodo(id, todoItemElement) {
    // 1. CSS slideOut 애니메이션 작동을 위해 클래스 추가
    todoItemElement.classList.add('removing');
    
    // 2. 애니메이션 동작 시간(350ms) 후 DOM에서 삭제 및 배열 갱신
    setTimeout(() => {
      todos = todos.filter(todo => todo.id !== id);
      saveToLocalStorage();
      renderTodos();
      updateProgress();
    }, 350);
  }

  // ==========================================================================
  // 6. UI RENDER & UPDATE FUNCTIONS (화면 업데이트 및 동적 효과)
  // ==========================================================================

  // 할 일 목록 렌더링
  function renderTodos() {
    todoList.innerHTML = '';
    
    // 필터링 적용
    const filteredTodos = todos.filter(todo => {
      if (currentFilter === 'active') return !todo.completed;
      if (currentFilter === 'completed') return todo.completed;
      return true;
    });

    // 목록이 비어 있는 경우 엠프티 스테이트 처리
    if (filteredTodos.length === 0) {
      emptyState.classList.remove('hidden');
      todoList.classList.add('hidden');
      
      // 필터 상태에 따른 메시지 변경
      const emptyMessage = emptyState.querySelector('.empty-message');
      if (currentFilter === 'active') {
        emptyMessage.innerHTML = '진행 중인 할 일이 없습니다.<br>오늘의 여유를 즐겨보세요! ☕';
      } else if (currentFilter === 'completed') {
        emptyMessage.innerHTML = '완료된 할 일이 아직 없습니다.<br>하나씩 차근차근 해결해 볼까요? 💪';
      } else {
        emptyMessage.innerHTML = '할 일 목록이 비어 있습니다.<br>새로운 목표를 추가해 보세요! ✨';
      }
    } else {
      emptyState.classList.add('hidden');
      todoList.classList.remove('hidden');
      
      // 리스트 아이템 동적 빌드 및 추가
      filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', todo.id);
        
        li.innerHTML = `
          <div class="todo-content">
            <button class="custom-checkbox" aria-label="${todo.completed ? '미완료로 변경' : '완료로 변경'}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <span class="todo-text">${escapeHTML(todo.text)}</span>
          </div>
          <button class="delete-btn" aria-label="할 일 삭제">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        `;
        
        todoList.appendChild(li);
      });
    }
  }

  // 달성률 및 게이지 바 업데이트
  function updateProgress() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    
    // 퍼센트 계산
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    // 게이지 및 텍스트 업데이트 (CSS Transition 적용됨)
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}%`;
    
    // 상세 설명 텍스트 업데이트
    if (total === 0) {
      progressCount.textContent = '진행할 작업을 추가해 주세요.';
    } else {
      progressCount.textContent = `총 ${total}개의 작업 중 ${completed}개를 완료했습니다.`;
    }
  }

  // 필터 상태 변경 및 슬라이더 무브먼트
  function changeFilter(filterValue, activeTabElement) {
    currentFilter = filterValue;
    
    // 1. 활성 탭 스타일 전환
    filterTabs.forEach(tab => tab.classList.remove('active'));
    activeTabElement.classList.add('active');
    
    // 2. 슬라이딩 캡슐 위치 조정을 위한 HTML5 data-attribute 변경 (CSS 연동)
    filterNav.setAttribute('data-active-filter', filterValue);
    
    // 3. 필터링된 투두 렌더링
    renderTodos();
  }

  // ==========================================================================
  // 7. THEME CONTROL FUNCTIONS (다크/라이트 테마 관리)
  // ==========================================================================
  
  // 테마 설정 적용
  function setTheme(theme) {
    htmlDoc.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('flowtodo_theme', theme);
  }

  // 테마 상태 토글
  function toggleTheme() {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  }

  // ==========================================================================
  // 8. UTILITY FUNCTIONS (유틸리티 및 데이터 관리)
  // ==========================================================================

  // 로컬 스토리지 동기화
  function saveToLocalStorage() {
    localStorage.setItem('flowtodo_list', JSON.stringify(todos));
  }

  // XSS 방지를 위한 HTML 이스케이프 유틸리티
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // 앱 시동
  init();
});
