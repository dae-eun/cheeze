<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- 캐릭터 선택 버튼들 (최상단) -->
      <div class="mb-8">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">캐릭터 선택</h2>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="character in characters"
            :key="character.id"
            @click="selectCharacter(character)"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              selectedCharacter?.id === character.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
            ]"
          >
            <div class="flex items-center space-x-2">
              <span class="text-sm">{{ character.name }}</span>
              <span v-if="character.is_main" class="bg-yellow-500 text-yellow-900 px-1.5 py-0.5 rounded-full text-xs font-bold">
                메인
              </span>
            </div>
            <div class="text-xs opacity-75">{{ character.servers?.name }}</div>
          </button>
        </div>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="space-y-6">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div class="space-y-3">
            <div v-for="j in 3" :key="j" class="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 숙제 목록 -->
      <div v-else-if="selectedCharacter && assignedTodos.length > 0" class="space-y-8">
        <!-- 일간 숙제 -->
        <div v-if="assignedDailyTodos.length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span class="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs mr-2">
              일간
            </span>
            일간 숙제
          </h3>
          <div class="space-y-3">
            <div
              v-for="todo in assignedDailyTodos"
              :key="todo.id"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <!-- 체크박스 또는 반복횟수 표시 -->
              <div v-if="getTodoTargetCount(todo.id) > 1" class="flex flex-col items-center space-y-1">
                <!-- 반복횟수 표시 -->
                <div class="text-center">
                  <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {{ getTodoCurrentCount(todo.id) }}/{{ getTodoTargetCount(todo.id) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">진행도</div>
                </div>
                <!-- 진행률 바 -->
                <div class="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-blue-500 transition-all duration-300"
                    :style="{ width: Math.min((getTodoCurrentCount(todo.id) / getTodoTargetCount(todo.id)) * 100, 100) + '%' }"
                  ></div>
                </div>
                <!-- 완료 체크 표시 -->
                <div v-if="isTodoCompleted(todo.id)" class="text-green-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <input
                v-else
                type="checkbox"
                :checked="isTodoCompleted(todo.id)"
                @change="toggleTodo(todo.id, !isTodoCompleted(todo.id))"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                  <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                    {{ getProgressTypeLabel(todo.progress_type) }}
                  </span>
                  <span v-if="todo.is_admin_todo" class="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                    관리자
                  </span>
                </div>
                <p v-if="todo.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ todo.description }}
                </p>
              </div>
              <!-- 반복횟수 증가 버튼 -->
              <div v-if="getTodoTargetCount(todo.id) > 1 && !isTodoCompleted(todo.id)" class="flex items-center space-x-2">
                <button
                  @click="incrementTodoCount(todo.id)"
                  class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                  title="반복횟수 증가"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>+1</span>
                </button>
              </div>
              <button
                @click="removeTodo(todo.id)"
                class="text-red-500 hover:text-red-700 transition-colors"
                title="숙제 제거"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 주간 숙제 -->
        <div v-if="assignedWeeklyTodos.length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span class="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs mr-2">
              주간
            </span>
            주간 숙제
          </h3>
          <div class="space-y-3">
            <div
              v-for="todo in assignedWeeklyTodos"
              :key="todo.id"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <!-- 체크박스 또는 반복횟수 표시 -->
              <div v-if="getTodoTargetCount(todo.id) > 1" class="flex flex-col items-center space-y-1">
                <!-- 반복횟수 표시 -->
                <div class="text-center">
                  <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {{ getTodoCurrentCount(todo.id) }}/{{ getTodoTargetCount(todo.id) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">진행도</div>
                </div>
                <!-- 진행률 바 -->
                <div class="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-blue-500 transition-all duration-300"
                    :style="{ width: Math.min((getTodoCurrentCount(todo.id) / getTodoTargetCount(todo.id)) * 100, 100) + '%' }"
                  ></div>
                </div>
                <!-- 완료 체크 표시 -->
                <div v-if="isTodoCompleted(todo.id)" class="text-green-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <input
                v-else
                type="checkbox"
                :checked="isTodoCompleted(todo.id)"
                @change="toggleTodo(todo.id, !isTodoCompleted(todo.id))"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                  <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                    {{ getProgressTypeLabel(todo.progress_type) }}
                  </span>
                  <span v-if="todo.is_admin_todo" class="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                    관리자
                  </span>
                </div>
                <p v-if="todo.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ todo.description }}
                </p>
              </div>
              <!-- 반복횟수 증가 버튼 -->
              <div v-if="getTodoTargetCount(todo.id) > 1 && !isTodoCompleted(todo.id)" class="flex items-center space-x-2">
                <button
                  @click="incrementTodoCount(todo.id)"
                  class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                  title="반복횟수 증가"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>+1</span>
                </button>
              </div>
              <button
                @click="removeTodo(todo.id)"
                class="text-red-500 hover:text-red-700 transition-colors"
                title="숙제 제거"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 월간 숙제 -->
        <div v-if="assignedMonthlyTodos.length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span class="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-xs mr-2">
              월간
            </span>
            월간 숙제
          </h3>
          <div class="space-y-3">
            <div
              v-for="todo in assignedMonthlyTodos"
              :key="todo.id"
              class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <!-- 체크박스 또는 반복횟수 표시 -->
              <div v-if="getTodoTargetCount(todo.id) > 1" class="flex flex-col items-center space-y-1">
                <!-- 반복횟수 표시 -->
                <div class="text-center">
                  <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {{ getTodoCurrentCount(todo.id) }}/{{ getTodoTargetCount(todo.id) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">진행도</div>
                </div>
                <!-- 진행률 바 -->
                <div class="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-blue-500 transition-all duration-300"
                    :style="{ width: Math.min((getTodoCurrentCount(todo.id) / getTodoTargetCount(todo.id)) * 100, 100) + '%' }"
                  ></div>
                </div>
                <!-- 완료 체크 표시 -->
                <div v-if="isTodoCompleted(todo.id)" class="text-green-500">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <input
                v-else
                type="checkbox"
                :checked="isTodoCompleted(todo.id)"
                @change="toggleTodo(todo.id, !isTodoCompleted(todo.id))"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                  <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                    {{ getProgressTypeLabel(todo.progress_type) }}
                  </span>
                  <span v-if="todo.is_admin_todo" class="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                    관리자
                  </span>
                </div>
                <p v-if="todo.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ todo.description }}
                </p>
              </div>
              <!-- 반복횟수 증가 버튼 -->
              <div v-if="getTodoTargetCount(todo.id) > 1 && !isTodoCompleted(todo.id)" class="flex items-center space-x-2">
                <button
                  @click="incrementTodoCount(todo.id)"
                  class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                  title="반복횟수 증가"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>+1</span>
                </button>
              </div>
              <button
                @click="removeTodo(todo.id)"
                class="text-red-500 hover:text-red-700 transition-colors"
                title="숙제 제거"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 완료율 표시 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">진행 현황</h3>
          <div class="flex items-center space-x-4">
            <div class="flex-1">
              <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>전체 완료율</span>
                <span>{{ completionRate }}%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  :style="{ width: completionRate + '%' }"
                ></div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ completedCount }}/{{ assignedCount }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">완료된 숙제</div>
            </div>
          </div>
        </div>

        <!-- 숙제 추가 버튼 -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-blue-800 dark:text-blue-200">
                숙제 추가하기
              </h3>
              <p class="mt-2 text-blue-700 dark:text-blue-300">
                캐릭터에게 숙제를 할당하거나 새로운 숙제를 생성할 수 있습니다.
              </p>
              <div class="mt-4 space-x-3">
                <button
                  @click="openAddTodoModal"
                  class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  숙제 할당하기
                </button>
                <NuxtLink
                  to="/todos"
                  class="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
                >
                  숙제 관리로 이동
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 캐릭터 미선택 상태 -->
      <div v-else-if="!selectedCharacter" class="text-center py-12">
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">캐릭터를 선택해주세요</h3>
        <p class="text-gray-600 dark:text-gray-400">위의 캐릭터 버튼을 클릭하여 숙제를 관리할 캐릭터를 선택하세요.</p>
      </div>

      <!-- 숙제 없음 상태 -->
      <div v-else class="text-center py-12">
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">숙제가 없습니다</h3>
        <p class="text-gray-600 dark:text-gray-400">이 캐릭터에 할당된 숙제가 없습니다.</p>
        <div class="mt-4 space-x-3">
          <button
            @click="openAddTodoModal"
            class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            숙제 할당하기
          </button>
          <NuxtLink
            to="/todos"
            class="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
          >
            숙제 관리로 이동
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 숙제 할당 모달 -->
    <div v-if="showAddTodoModal" class="fixed inset-0 flex items-center justify-center z-50" style="background-color: rgba(0, 0, 0, 0.5);">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ selectedCharacter?.name }}에게 숙제 할당하기
          </h3>
          <button
            @click="showAddTodoModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 검색 필터 -->
        <div class="mb-6">
          <div class="flex space-x-4 mb-4">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="숙제 검색..."
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              v-model="selectedCycle"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 주기</option>
              <option value="daily">일간</option>
              <option value="weekly">주간</option>
                              <option value="weekend">주말</option>
            </select>
          </div>
        </div>

                 <!-- 숙제 목록 -->
         <div class="space-y-3 max-h-96 overflow-y-auto">
           <div
             v-for="todo in filteredTodos"
             :key="todo.id"
             class="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
           >
             <div class="flex-1">
               <div class="flex items-center space-x-2 mb-2">
                 <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                 <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                   {{ getProgressTypeLabel(todo.progress_type) }}
                 </span>
                 <span class="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                   {{ getCycleLabel(todo.repeat_cycle) }}
                 </span>
                 <span v-if="todo.is_admin_todo" class="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                   관리자
                 </span>
                 <span v-if="isTodoAssigned(todo.id)" class="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs">
                   할당됨
                 </span>
               </div>
               <p v-if="todo.description" class="text-sm text-gray-600 dark:text-gray-400">
                 {{ todo.description }}
               </p>
             </div>
             <!-- 토글 스위치 -->
             <button
               @click="toggleTodoSelection(todo.id)"
               class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
               :class="getTodoToggleState(todo.id) ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'"
             >
               <span
                 class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                 :class="getTodoToggleState(todo.id) ? 'translate-x-6' : 'translate-x-1'"
               ></span>
             </button>
           </div>
         </div>

        <!-- 할당된 숙제가 없을 때 -->
        <div v-if="filteredTodos.length === 0" class="text-center py-8">
          <div class="text-gray-400 dark:text-gray-500 mb-4">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <p class="text-gray-600 dark:text-gray-400">할당할 수 있는 숙제가 없습니다.</p>
        </div>

                 <div class="mt-6 flex justify-between items-center">
           <div class="text-sm text-gray-600 dark:text-gray-400">
             {{ pendingChanges.size }}개 변경사항 대기 중
           </div>
           <div class="flex space-x-3">
             <button
               @click="showAddTodoModal = false"
               class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-md transition-colors"
             >
               닫기
             </button>
             <button
               @click="applyChanges"
               :disabled="pendingChanges.size === 0 || assigning"
               class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
             >
               {{ assigning ? '적용 중...' : '변경하기' }}
             </button>
           </div>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

// 타입 정의
interface Todo {
  id: string
  title: string
  description: string
  created_at: string
  updated_at: string
  created_by: string
  is_admin_todo: boolean
  repeat_cycle: 'daily' | 'weekly' | 'weekend'
  progress_type: 'dungeon' | 'quest' | 'purchase' | 'exchange' | 'other'
  target_count?: number
}

interface Character {
  id: string
  name: string
  server_id: string
  is_main: boolean
  servers?: {
    name: string
  }
}

interface TodoCharacter {
  id: string
  todo_id: string
  character_id: string
  is_completed: boolean
  completed_at: string | null
  completion_date: string
  current_count: number
  target_count: number
}

interface User {
  id: string
  name: string
  email: string
  organization_id: string | null
  created_at: string
}

definePageMeta({
  layout: 'default'
})

import { useUserStore } from '~/stores/user'

const { logout } = useAuth()
const userStore = useUserStore()
const charactersStore = useCharactersStore()
const todosStore = useTodosStore()

// 상태 관리
const characters = ref<Character[]>([])
const todos = ref<Todo[]>([])
const todoCharacters = ref<TodoCharacter[]>([])
const selectedCharacter = ref<Character | null>(null)
const loading = ref(false)
const toggling = ref(false)
const removing = ref(false)
const showAddTodoModal = ref(false)
const searchQuery = ref('')
const selectedCycle = ref('')
const assigning = ref(false)
const selectedTodoIds = ref<string[]>([])
const pendingChanges = ref<Map<string, boolean>>(new Map())

// 계산된 속성들 - 할당된 숙제들만 필터링
const assignedTodos = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const assignedTodoIds = todoCharacters.value
    .filter(tc => tc.completion_date === today)
    .map(tc => tc.todo_id)
  
  return todos.value.filter(todo => assignedTodoIds.includes(todo.id))
})

const assignedDailyTodos = computed(() => assignedTodos.value.filter(todo => todo.repeat_cycle === 'daily'))
const assignedWeeklyTodos = computed(() => assignedTodos.value.filter(todo => todo.repeat_cycle === 'weekly'))
const assignedMonthlyTodos = computed(() => assignedTodos.value.filter(todo => todo.repeat_cycle === 'weekend'))

const assignedCount = computed(() => todoCharacters.value.filter(tc => {
  const today = new Date().toISOString().split('T')[0]
  return tc.completion_date === today
}).length)

const completedCount = computed(() => todoCharacters.value.filter(tc => {
  const today = new Date().toISOString().split('T')[0]
  return tc.is_completed && tc.completion_date === today
}).length)

const completionRate = computed(() => 
  assignedCount.value > 0 ? Math.round((completedCount.value / assignedCount.value) * 100) : 0
)

// 시스템 사용자 여부 확인
const isSystemUser = computed(() => {
  return userStore.user?.organization_id === null
})

// 진행현황 계산 함수
const calculateProgressByCycle = (cycle: string) => {
  const today = new Date().toISOString().split('T')[0]
  
  // 해당 주기의 숙제들
  const cycleTodos = assignedTodos.value.filter(todo => todo.repeat_cycle === cycle)
  const cycleTodoIds = cycleTodos.map(todo => todo.id)
  
  // 오늘 날짜의 해당 주기 숙제들
  const todayCycleTodos = todoCharacters.value.filter(tc => 
    cycleTodoIds.includes(tc.todo_id) && tc.completion_date === today
  )
  
  const total = todayCycleTodos.length
  const completed = todayCycleTodos.filter(tc => tc.is_completed).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  
  // 진행 종류별 통계
  const byType = { dungeon: 0, quest: 0, purchase: 0, other: 0 }
  const byTypeTotal = { dungeon: 0, quest: 0, purchase: 0, other: 0 }
  
  todayCycleTodos.forEach(tc => {
    const todo = cycleTodos.find(t => t.id === tc.todo_id)
    if (todo) {
      const type = todo.progress_type as keyof typeof byType
      byTypeTotal[type]++
      if (tc.is_completed) {
        byType[type]++
      }
    }
  })
  
  return {
    total,
    completed,
    pending: total - completed,
    completionRate,
    byType,
    byTypeTotal
  }
}

// 일간/주간/주말 진행현황
const dailyProgress = computed(() => calculateProgressByCycle('daily'))
const weeklyProgress = computed(() => calculateProgressByCycle('weekly'))
const monthlyProgress = computed(() => calculateProgressByCycle('weekend'))

// 필터링된 숙제 목록 (모달용)
const filteredTodos = computed(() => {
  let filtered = todos.value

  // 검색어 필터링
  if (searchQuery.value) {
    filtered = filtered.filter(todo => 
      todo.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (todo.description && todo.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    )
  }

  // 주기 필터링
  if (selectedCycle.value) {
    filtered = filtered.filter(todo => todo.repeat_cycle === selectedCycle.value)
  }

  return filtered
})

// 캐릭터 목록 로드
const loadCharacters = async () => {
  try {
    const charactersData = await charactersStore.fetchCharacters()
    characters.value = charactersData
  } catch (error) {
    console.error('Error loading characters:', error)
  }
}

// 숙제 목록 로드
const loadTodos = async () => {
  loading.value = true
  try {
    const todosData = await todosStore.fetchTodos()
    todos.value = todosData as unknown as Todo[]
  } catch (error) {
    console.error('Error loading todos:', error)
  } finally {
    loading.value = false
  }
}

// 캐릭터별 숙제 매핑 로드
const loadTodoCharacters = async () => {
  if (!selectedCharacter.value) return

  try {
    const response = await $fetch(`/api/characters/${selectedCharacter.value.id}/todos`, {
      method: 'GET'
    })

    if (response.success) {
      todoCharacters.value = (response.todoCharacters || []) as unknown as TodoCharacter[]
    }
  } catch (error) {
    console.error('Error loading todo characters:', error)
  }
}

// 캐릭터 선택
const selectCharacter = async (character: Character) => {
  selectedCharacter.value = character
  await loadTodoCharacters()
  
  // URL 업데이트
  await router.push({
    query: { character: character.id }
  })
}

// 숙제 완료 상태 확인
const isTodoCompleted = (todoId: string) => {
  const today = new Date().toISOString().split('T')[0]
  return todoCharacters.value.some(tc => 
    tc.todo_id === todoId && 
    tc.is_completed && 
    tc.completion_date === today
  )
}

// 숙제 완료 상태 토글
const toggleTodo = async (todoId: string, isCompleted: boolean) => {
  if (!selectedCharacter.value || toggling.value) return

  toggling.value = true
  try {
    const response = await $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value.id}`, {
      method: 'PUT',
      body: {
        is_completed: isCompleted
      }
    })

    if (response.success) {
      await loadTodoCharacters()
    }
  } catch (error) {
    console.error('Error toggling todo:', error)
  } finally {
    toggling.value = false
  }
}

// 숙제 제거
const removeTodo = async (todoId: string) => {
  if (!selectedCharacter.value || removing.value) return

  // 할당된 숙제 찾기 (날짜와 관계없이)
  const todoCharacter = todoCharacters.value.find(tc => 
    tc.todo_id === todoId && tc.character_id === selectedCharacter.value!.id
  )

  if (!todoCharacter) {
    alert('할당된 숙제를 찾을 수 없습니다.')
    return
  }

  if (!confirm('정말로 이 숙제를 제거하시겠습니까?')) {
    return
  }

  removing.value = true
  try {
    const response = await $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      await loadTodoCharacters()
      alert('숙제가 성공적으로 제거되었습니다.')
    } else {
      alert('숙제 제거에 실패했습니다.')
    }
  } catch (error) {
    console.error('Error removing todo:', error)
    alert('숙제 제거 중 오류가 발생했습니다.')
  } finally {
    removing.value = false
  }
}

// 진행종류 라벨
const getProgressTypeLabel = (type: string) => {
  const labels = {
    dungeon: '던전',
    quest: '퀘스트',
    purchase: '구매',
    exchange: '교환',
    other: '기타'
  }
  return labels[type as keyof typeof labels] || type
}

// 반복횟수 관련 함수들
const getTodoTargetCount = (todoId: string) => {
  if (!selectedCharacter.value) return 1
  
  const today = new Date().toISOString().split('T')[0]
  const todoCharacter = todoCharacters.value.find(tc => 
    tc.todo_id === todoId && 
    tc.character_id === selectedCharacter.value?.id &&
    tc.completion_date === today
  )
  
  return todoCharacter?.target_count || 1
}

const getTodoCurrentCount = (todoId: string) => {
  if (!selectedCharacter.value) return 0
  
  const today = new Date().toISOString().split('T')[0]
  const todoCharacter = todoCharacters.value.find(tc => 
    tc.todo_id === todoId && 
    tc.character_id === selectedCharacter.value?.id &&
    tc.completion_date === today
  )
  
  return todoCharacter?.current_count || 0
}

const incrementTodoCount = async (todoId: string) => {
  if (!selectedCharacter.value) return
  
  try {
    const response = await $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value.id}/increment`, {
      method: 'POST'
    })
    
    if (response.success) {
      await loadTodoCharacters()
      console.log('반복횟수가 증가했습니다:', response.message)
    }
  } catch (error) {
    console.error('반복횟수 증가 실패:', error)
    alert('반복횟수 증가에 실패했습니다.')
  }
}

// 주기 라벨
const getCycleLabel = (cycle: string) => {
  const labels = {
    daily: '일간',
    weekly: '주간',
            월간: '월간'
  }
  return labels[cycle as keyof typeof labels] || cycle
}

// 숙제가 이미 할당되었는지 확인
const isTodoAssigned = (todoId: string) => {
  return todoCharacters.value.some(tc => 
    tc.todo_id === todoId && tc.character_id === selectedCharacter.value?.id
  )
}

// 숙제 할당 (단일)
const assignTodo = async (todoId: string) => {
  if (!selectedCharacter.value || assigning.value) return

  assigning.value = true
  try {
    const response = await $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value.id}`, {
      method: 'POST'
    })

    if (response.success) {
      await loadTodoCharacters()
      alert('숙제가 성공적으로 할당되었습니다.')
    }
  } catch (error) {
    console.error('Error assigning todo:', error)
    alert('숙제 할당에 실패했습니다.')
  } finally {
    assigning.value = false
  }
}



// 토글 상태 가져오기 (현재 할당 상태 + 대기 중인 변경사항)
const getTodoToggleState = (todoId: string) => {
  const currentState = isTodoAssigned(todoId)
  const pendingState = pendingChanges.value.get(todoId)
  
  // 대기 중인 변경사항이 있으면 그것을 반환, 없으면 현재 상태 반환
  return pendingState !== undefined ? pendingState : currentState
}

// 토글 선택 (실제 적용은 하지 않고 상태만 변경)
const toggleTodoSelection = (todoId: string) => {
  const currentState = isTodoAssigned(todoId)
  const pendingState = pendingChanges.value.get(todoId)
  
  // 현재 실제 상태
  const actualState = pendingState !== undefined ? pendingState : currentState
  
  // 반대 상태로 변경
  pendingChanges.value.set(todoId, !actualState)
}

// 변경사항 적용하기
const applyChanges = async () => {
  if (!selectedCharacter.value || assigning.value || pendingChanges.value.size === 0) return

  assigning.value = true
  try {
    const promises: Promise<any>[] = []
    
    for (const [todoId, newState] of pendingChanges.value) {
      const currentState = isTodoAssigned(todoId)
      
      if (newState !== currentState) {
        if (newState) {
          // 할당
          promises.push(
            $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value!.id}`, {
              method: 'POST'
            }) as Promise<any>
          )
        } else {
          // 해제
          promises.push(
            $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value!.id}`, {
              method: 'DELETE'
            }) as Promise<any>
          )
        }
      }
    }

    if (promises.length > 0) {
      const results = await Promise.all(promises)
      const successCount = results.filter(result => result.success).length

      if (successCount > 0) {
        await loadTodoCharacters()
        pendingChanges.value.clear() // 대기 중인 변경사항 초기화
        alert(`${successCount}개의 변경사항이 성공적으로 적용되었습니다.`)
        showAddTodoModal.value = false
      }
    }
  } catch (error) {
    console.error('Error applying changes:', error)
    alert('변경사항 적용 중 오류가 발생했습니다.')
  } finally {
    assigning.value = false
  }
}

// 모달 열기
const openAddTodoModal = () => {
  pendingChanges.value.clear() // 대기 중인 변경사항 초기화
  showAddTodoModal.value = true
}

// URL 쿼리 파라미터에서 캐릭터 ID 가져오기
const route = useRoute()
const router = useRouter()

// URL 쿼리 파라미터로 캐릭터 자동 선택
const selectCharacterFromQuery = () => {
  const characterId = route.query.character as string
  if (characterId && characters.value.length > 0) {
    const character = characters.value.find(c => c.id === characterId)
    if (character) {
      selectedCharacter.value = character
      loadTodoCharacters()
      return true // 성공적으로 선택됨
    }
  }
  return false // 선택되지 않음
}

// 페이지 로드 시 데이터 가져오기
onMounted(async () => {
  try {
    // 스토어에서 사용자 정보 가져오기
    const user = await userStore.fetchUser()
    if (user) {
      await loadCharacters()
      await loadTodos()
      
      // URL 쿼리 파라미터로 캐릭터 자동 선택
      const characterSelected = selectCharacterFromQuery()
      
      // 쿼리스트링에 캐릭터가 없으면 첫 번째 캐릭터 선택
      if (!characterSelected && characters.value.length > 0 && characters.value[0]) {
        selectCharacter(characters.value[0])
      }
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})
</script> 