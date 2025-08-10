<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-4 lg:px-8">
      <!-- 캐릭터 선택 버튼들 (최상단) -->
      <div class="mb-6 sm:mb-8">
        <h2 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">캐릭터 선택</h2>
        <div class="flex flex-wrap gap-2 sm:gap-3">
          <button
            v-for="character in characters"
            :key="character.id"
            @click="selectCharacter(character)"
            :class="[
              'px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base',
              selectedCharacter?.id === character.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
            ]"
          >
            <div class="flex items-center space-x-1 sm:space-x-2">
              <span class="text-xs sm:text-sm">{{ character.name }}</span>
              <span v-if="character.is_main" class="bg-yellow-500 text-yellow-900 px-1 py-0.5 rounded-full text-xs font-bold">
                메인
              </span>
            </div>
            <div class="text-xs opacity-75 hidden sm:block">{{ character.servers?.name }}</div>
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
        <!-- 진행현황 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
          <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">진행 현황</h3>
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

        <!-- 진행 중인 숙제 -->
        <div class="space-y-8">
          <!-- 일간 숙제 -->
          <div v-if="assignedDailyTodos.filter(todo => !isTodoCompleted(todo.id)).length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
              <span class="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs mr-2">
                일간
              </span>
              일간 숙제
            </h3>
            <div class="space-y-3">
              <TransitionGroup
                name="slide-out"
                tag="div"
                class="space-y-3"
              >
                <div
                  v-for="todo in assignedDailyTodos.filter(todo => !isTodoCompleted(todo.id))"
                  :key="todo.id"
                  class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  <!-- 숙제 정보 -->
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                      <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                        {{ getProgressTypeLabel(todo.progress_type) }}
                      </span>
                    </div>
                    <p v-if="todo.description" class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {{ todo.description }}
                    </p>
                  </div>

                  <!-- 오른쪽 액션 영역 -->
                  <div class="flex items-center justify-end sm:justify-start space-x-2 sm:space-x-3">
                    <!-- 진행도 표시 (반복횟수가 있는 경우) -->
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
                    </div>

                    <!-- 체크박스 (반복횟수가 없는 경우) -->
                    <input
                      v-else
                      type="checkbox"
                      :checked="isTodoCompleted(todo.id)"
                      @change="toggleTodo(todo.id, !isTodoCompleted(todo.id))"
                      class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />

                    <!-- 반복횟수 증가 버튼 + 즉시 완료 체크박스 -->
                    <div v-if="getTodoTargetCount(todo.id) > 1" class="flex items-center space-x-3">
                      <div class="flex items-center justify-center w-10 h-10">
                      <button
                        v-if="!isTodoCompleted(todo.id)"
                        @click="incrementTodoCount(todo.id)"
                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        title="반복횟수 증가"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <div v-else class="text-green-500">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </div>
                      </div>
                      <!-- 즉시 완료 체크박스 -->
                      <input
                        type="checkbox"
                        :checked="false"
                        @change="toggleTodo(todo.id, true)"
                        class="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        title="완료 처리"
                      />
                    </div>

                    <!-- 삭제 버튼 -->
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
              </TransitionGroup>
            </div>
          </div>

          <!-- 주간 숙제 -->
          <div v-if="assignedWeeklyTodos.filter(todo => !isTodoCompleted(todo.id)).length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
              <span class="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs mr-2">
                주간
              </span>
              주간 숙제
            </h3>
            <div class="space-y-3">
              <TransitionGroup
                name="slide-out"
                tag="div"
                class="space-y-3"
              >
                <div
                  v-for="todo in assignedWeeklyTodos.filter(todo => !isTodoCompleted(todo.id))"
                  :key="todo.id"
                  class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  <!-- 숙제 정보 -->
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                      <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                        {{ getProgressTypeLabel(todo.progress_type) }}
                      </span>
                    </div>
                    <p v-if="todo.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {{ todo.description }}
                    </p>
                  </div>

                  <!-- 오른쪽 액션 영역 -->
                  <div class="flex items-center space-x-3">
                    <!-- 진행도 표시 (반복횟수가 있는 경우) -->
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
                    </div>

                    <!-- 체크박스 (반복횟수가 없는 경우) -->
                    <input
                      v-else
                      type="checkbox"
                      :checked="isTodoCompleted(todo.id)"
                      @change="toggleTodo(todo.id, !isTodoCompleted(todo.id))"
                      class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />

                    <!-- 반복횟수 증가 버튼 + 즉시 완료 체크박스 -->
                    <div v-if="getTodoTargetCount(todo.id) > 1" class="flex items-center space-x-3">
                      <div class="flex items-center justify-center w-10 h-10">
                      <button
                        v-if="!isTodoCompleted(todo.id)"
                        @click="incrementTodoCount(todo.id)"
                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        title="반복횟수 증가"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <div v-else class="text-green-500">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </div>
                      </div>
                      <!-- 즉시 완료 체크박스 -->
                      <input
                        type="checkbox"
                        :checked="false"
                        @change="toggleTodo(todo.id, true)"
                        class="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        title="완료 처리"
                      />
                    </div>

                    <!-- 삭제 버튼 -->
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
              </TransitionGroup>
            </div>
          </div>

          <!-- 주말 숙제 -->
          <div v-if="assignedMonthlyTodos.filter(todo => !isTodoCompleted(todo.id)).length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
            <h3 class="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
              <span class="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-xs mr-2">
                주말
              </span>
              주말 숙제
            </h3>
            <div class="space-y-3">
              <TransitionGroup
                name="slide-out"
                tag="div"
                class="space-y-3"
              >
                <div
                  v-for="todo in assignedMonthlyTodos.filter(todo => !isTodoCompleted(todo.id))"
                  :key="todo.id"
                  class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
                >
                  <!-- 숙제 정보 -->
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                      <span class="bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-xs">
                        {{ getProgressTypeLabel(todo.progress_type) }}
                      </span>
                    </div>
                    <p v-if="todo.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {{ todo.description }}
                    </p>
                  </div>

                  <!-- 오른쪽 액션 영역 -->
                  <div class="flex items-center space-x-3">
                    <!-- 진행도 표시 (반복횟수가 있는 경우) -->
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
                    </div>

                    <!-- 체크박스 (반복횟수가 없는 경우) -->
                    <input
                      v-else
                      type="checkbox"
                      :checked="isTodoCompleted(todo.id)"
                      @change="toggleTodo(todo.id, !isTodoCompleted(todo.id))"
                      class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />

                    <!-- 반복횟수 증가 버튼 + 즉시 완료 체크박스 -->
                    <div v-if="getTodoTargetCount(todo.id) > 1" class="flex items-center space-x-3">
                      <div class="flex items-center justify-center w-10 h-10">
                      <button
                        v-if="!isTodoCompleted(todo.id)"
                        @click="incrementTodoCount(todo.id)"
                        class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                        title="반복횟수 증가"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <div v-else class="text-green-500">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </div>
                      </div>
                      <!-- 즉시 완료 체크박스 -->
                      <input
                        type="checkbox"
                        :checked="false"
                        @change="toggleTodo(todo.id, true)"
                        class="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        title="완료 처리"
                      />
                    </div>

                    <!-- 삭제 버튼 -->
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
              </TransitionGroup>
            </div>
          </div>
        </div>

                 <!-- 완료된 숙제 -->
         <div v-if="completedTodos.length > 0" class="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 sm:p-6 shadow-sm border border-green-200 dark:border-green-800">
           <h3 class="text-base sm:text-lg font-medium text-green-900 dark:text-green-100 mb-3 sm:mb-4 flex items-center">
             <svg class="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
               <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
             </svg>
             완료된 숙제 ({{ completedTodos.length }}개)
           </h3>
           <div class="space-y-3">
             <TransitionGroup
               name="slide-in"
               tag="div"
               class="space-y-3"
             >
               <div
                 v-for="todo in completedTodos"
                 :key="todo.id"
                 class="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
               >
                 <!-- 숙제 정보 -->
                 <div class="flex-1">
                   <div class="flex flex-wrap items-center gap-2">
                     <span class="font-medium text-green-900 dark:text-green-100 line-through text-sm sm:text-base">{{ todo.title }}</span>
                     <span class="bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs">
                       {{ getProgressTypeLabel(todo.progress_type) }}
                     </span>
                     <span class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                       {{ getCycleLabel(todo.repeat_cycle) }}
                     </span>
                   </div>
                   <p v-if="todo.description" class="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-1 line-through">
                     {{ todo.description }}
                   </p>
                 </div>

                 <!-- 완료 시간과 되돌리기 버튼 -->
                 <div class="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                   <div class="text-xs text-green-600 dark:text-green-400 text-right sm:text-left">
                     {{ getCompletedTime(todo.id) }}
                   </div>
                   <button
                     @click="undoCompletedTodo(todo.id)"
                     class="flex items-center space-x-1 px-2 py-1 bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-md text-xs font-medium transition-colors"
                     title="완료 취소"
                   >
                     <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                     </svg>
                     <span>되돌리기</span>
                   </button>
                 </div>
               </div>
             </TransitionGroup>
           </div>
                   </div>

          <!-- 숙제 추가 버튼 -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6">
           <div class="flex items-start">
             <div class="flex-shrink-0">
               <svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
               </svg>
             </div>
                            <div class="ml-3">
                 <h3 class="text-base sm:text-lg font-medium text-blue-800 dark:text-blue-200">
                   숙제 추가하기
                 </h3>
                 <p class="mt-2 text-sm sm:text-base text-blue-700 dark:text-blue-300">
                   캐릭터에게 숙제를 할당하거나 새로운 숙제를 생성할 수 있습니다.
                 </p>
                 <div class="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                   <button
                     @click="openAddTodoModal"
                     class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-sm sm:text-base"
                   >
                     숙제 할당하기
                   </button>
                   <NuxtLink
                     to="/todos"
                     class="inline-flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors text-sm sm:text-base"
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
        <!-- 아이콘 -->
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <svg
            class="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            ></path>
          </svg>
        </div>

        <!-- 텍스트 -->
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          숙제가 없습니다
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          이 캐릭터에 할당된 숙제가 없습니다.
        </p>

        <!-- 버튼 모음 -->
        <div class="mt-4 flex flex-wrap justify-center gap-3">
          <!-- 숙제 할당하기 -->
          <button
            @click="openAddTodoModal"
            class="flex items-center h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            숙제 할당하기
          </button>

          <!-- 숙제 복사 -->
          <button
            @click="showCopyModal = true"
            class="flex items-center h-10 px-4 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
            </svg>
            숙제 복사
          </button>

          <!-- 숙제 관리로 이동 -->
          <NuxtLink
            to="/todos"
            class="flex items-center h-10 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
          >
            숙제 관리로 이동
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 숙제 할당 모달 -->
    <div v-if="showAddTodoModal" class="fixed inset-0 flex items-center justify-center z-50" style="background-color: rgba(0, 0, 0, 0.5);" @click="showAddTodoModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" @click.stop>
        <!-- 헤더 -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ selectedCharacter?.name }}에게 숙제 할당하기
          </h3>
          <button
            @click="showAddTodoModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 검색 및 필터 -->
        <div class="mb-6">
          <div class="flex gap-3">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="숙제 검색..."
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              v-model="selectedCycle"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">모든 주기</option>
              <option value="daily">일간</option>
              <option value="weekly">주간</option>
              <option value="weekend">주말</option>
            </select>
          </div>
        </div>

        <!-- 숙제 목록 -->
        <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
          <div
            v-for="todo in filteredTodos"
            :key="todo.id"
            class="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <!-- 숙제 정보 -->
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-1">
                <span class="font-medium text-gray-900 dark:text-white">{{ todo.title }}</span>
                <span v-if="todo.description" class="text-sm text-gray-500 dark:text-gray-400">
                  {{ todo.description }}
                </span>
              </div>
              
              <!-- 태그들 -->
              <div class="flex flex-wrap gap-1 mt-2">
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
            </div>

            <!-- 토글 스위치 (오른쪽) -->
            <div class="flex flex-row items-center space-x-3 pt-1">
                        <!-- 길드 공유 체크박스 -->
              <div v-if="getTodoToggleState(todo.id)" class="flex flex-col items-center space-y-1">
                <span class="text-xs text-blue-700 dark:text-blue-300 text-center">길드에 공유</span>
                <input
                  :checked="getShareWithGuildState(todo.id)"
                  @change="toggleShareWithGuild(todo.id)"
                  type="checkbox"
                  class="w-4 h-4 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
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

        <!-- 하단 버튼 -->
        <div class="mt-6 flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600 gap-4">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            {{ pendingChanges.size }}개 변경사항 대기 중
          </div>
          <div class="flex flex-wrap gap-2 sm:gap-3">
            <!-- 모두할당하기/모두해제하기 버튼 -->
            <button
              @click="selectAllTodos"
              :disabled="filteredTodos.length === 0"
              class="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              모두할당하기
            </button>
            <button
              @click="unselectAllTodos"
              :disabled="filteredTodos.length === 0"
              class="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              모두해제하기
            </button>
            <!-- 기존 버튼들 -->
            <button
              @click="showAddTodoModal = false"
              class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
            >
              닫기
            </button>
            <button
              @click="applyChanges"
              :disabled="pendingChanges.size === 0 || assigning"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {{ assigning ? '적용 중...' : '변경하기' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 숙제 복사 모달 -->
    <div v-if="showCopyModal" class="fixed inset-0 flex items-center justify-center z-50" style="background-color: rgba(0, 0, 0, 0.5);" @click="showCopyModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl" @click.stop>
        <!-- 헤더 -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            숙제 복사하기
          </h3>
          <button
            @click="showCopyModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 설명 -->
        <div class="mb-6">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            다른 캐릭터의 숙제를 <strong>{{ selectedCharacter?.name }}</strong>에게 복사합니다.
          </p>
        </div>

        <!-- 캐릭터 선택 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            복사할 캐릭터 선택
          </label>
          <select
            v-model="selectedSourceCharacter"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">캐릭터를 선택하세요</option>
            <option
              v-for="character in characters.filter(c => c.id !== selectedCharacter?.id)"
              :key="character.id"
              :value="character.id"
            >
              {{ character.name }} ({{ character.servers?.name }})
              <span v-if="character.is_main"> - 메인</span>
            </option>
          </select>
        </div>

        <!-- 선택된 캐릭터의 숙제 미리보기 -->
        <div v-if="selectedSourceCharacter && sourceCharacterTodos.length > 0" class="mb-6">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            복사될 숙제 목록 ({{ sourceCharacterTodos.length }}개)
          </h4>
          <div class="max-h-40 overflow-y-auto space-y-2 pr-2">
            <div
              v-for="todo in sourceCharacterTodos"
              :key="todo.id"
              class="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="flex-1">
                <div class="text-sm font-medium text-gray-900 dark:text-white">{{ todo.title }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ getCycleLabel(todo.repeat_cycle) }}</div>
              </div>
              <div class="flex items-center space-x-2">
                <span v-if="todo.is_shared" class="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                  공유
                </span>
                <span v-if="isTodoAssigned(todo.todo_id)" class="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full text-xs">
                  이미 할당됨
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 복사할 숙제가 없을 때 -->
        <div v-if="selectedSourceCharacter && sourceCharacterTodos.length === 0" class="mb-6">
          <div class="text-center py-4">
            <div class="text-gray-400 dark:text-gray-500 mb-2">
              <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">복사할 숙제가 없습니다.</p>
          </div>
        </div>

        <!-- 하단 버튼 -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            @click="showCopyModal = false"
            class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            @click="copyTodos"
            :disabled="!selectedSourceCharacter || sourceCharacterTodos.length === 0 || copying"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {{ copying ? '복사 중...' : '복사하기' }}
          </button>
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
  is_shared: boolean
  updated_at?: string
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
interface PendingChange {
  isAssigned: boolean
  isShared: boolean
}

const pendingChanges = ref<Map<string, PendingChange>>(new Map())

// 숙제 복사 관련 상태
const showCopyModal = ref(false)
const selectedSourceCharacter = ref('')
const copying = ref(false)
const sourceCharacterTodos = ref<Array<{
  id: string
  todo_id: string
  title: string
  repeat_cycle: string
  is_shared: boolean
}>>([])

// 최신 레코드 선별: 같은 todo_id 중 가장 최근(completion_date DESC, updated_at DESC)
const getLatestTodoCharacterMap = (rows: TodoCharacter[]) => {
  const sorted = [...rows].sort((a, b) => {
    const dateA = a.completion_date || ''
    const dateB = b.completion_date || ''
    if (dateA !== dateB) return dateA > dateB ? -1 : 1
    const updatedA = a.updated_at || ''
    const updatedB = b.updated_at || ''
    return updatedA > updatedB ? -1 : updatedA < updatedB ? 1 : 0
  })
  const map = new Map<string, TodoCharacter>()
  for (const row of sorted) {
    if (!map.has(row.todo_id)) {
      map.set(row.todo_id, row)
    }
  }
  return map
}

// 계산된 속성들 - 할당된 숙제들만 필터링(최신 레코드 기준)
const assignedTodos = computed(() => {
  const latestMap = getLatestTodoCharacterMap(todoCharacters.value)
  const assignedTodoIds = Array.from(latestMap.keys())
  return todos.value.filter(todo => assignedTodoIds.includes(todo.id))
})

// 정렬 함수
const sortTodos = (todos: any[]) => {
  return todos.sort((a, b) => {
    const progressTypeA = a.progress_type || ''
    const progressTypeB = b.progress_type || ''
    const titleA = a.title || ''
    const titleB = b.title || ''
    
    // progress_type 순서 정의 (던전 -> 퀘스트 -> 구매 -> 교환 -> 기타)
    const progressTypeOrder = {
      'dungeon': 1,
      'quest': 2,
      'purchase': 3,
      'exchange': 4,
      'other': 5
    }
    
    const orderA = progressTypeOrder[progressTypeA as keyof typeof progressTypeOrder] || 6
    const orderB = progressTypeOrder[progressTypeB as keyof typeof progressTypeOrder] || 6
    
    // progress_type이 다르면 progress_type으로 정렬
    if (orderA !== orderB) {
      return orderA - orderB
    }
    
    // progress_type이 같으면 title로 정렬
    return titleA.localeCompare(titleB, 'ko')
  })
}

const assignedDailyTodos = computed(() => sortTodos(assignedTodos.value.filter(todo => todo.repeat_cycle === 'daily')))
const assignedWeeklyTodos = computed(() => sortTodos(assignedTodos.value.filter(todo => todo.repeat_cycle === 'weekly')))
const assignedMonthlyTodos = computed(() => sortTodos(assignedTodos.value.filter(todo => todo.repeat_cycle === 'weekend')))

// 완료된 숙제 목록
const completedTodos = computed(() => {
  return assignedTodos.value.filter(todo => isTodoCompleted(todo.id))
})

const assignedCount = computed(() => {
  const latestMap = getLatestTodoCharacterMap(todoCharacters.value)
  return latestMap.size
})

const completedCount = computed(() => {
  const latestMap = getLatestTodoCharacterMap(todoCharacters.value)
  return Array.from(latestMap.values()).filter(tc => tc.is_completed).length
})

const completionRate = computed(() => 
  assignedCount.value > 0 ? Math.round((completedCount.value / assignedCount.value) * 100) : 0
)

// 시스템 사용자 여부 확인
const isSystemUser = computed(() => {
  return userStore.user?.organization_id === null
})

// 진행현황 계산 함수
const calculateProgressByCycle = (cycle: string) => {
  const latestMap = getLatestTodoCharacterMap(todoCharacters.value)
  const cycleTodos = assignedTodos.value.filter(todo => todo.repeat_cycle === cycle)
  const cycleTodoIds = new Set(cycleTodos.map(todo => todo.id))
  const rows = Array.from(latestMap.values()).filter(tc => cycleTodoIds.has(tc.todo_id))

  const total = rows.length
  const completed = rows.filter(tc => tc.is_completed).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const byType = { dungeon: 0, quest: 0, purchase: 0, other: 0 }
  const byTypeTotal = { dungeon: 0, quest: 0, purchase: 0, other: 0 }

  rows.forEach(tc => {
    const todo = cycleTodos.find(t => t.id === tc.todo_id)
    if (todo) {
      const type = (todo.progress_type as keyof typeof byType) || 'other'
      if (byTypeTotal[type] !== undefined) byTypeTotal[type]++
      if (tc.is_completed && byType[type] !== undefined) byType[type]++
    }
  })

  return { total, completed, pending: total - completed, completionRate, byType, byTypeTotal }
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
  const latestMap = getLatestTodoCharacterMap(todoCharacters.value)
  const latest = latestMap.get(todoId)
  return !!latest?.is_completed
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
  const latestMap = getLatestTodoCharacterMap(todoCharacters.value)
  const row = latestMap.get(todoId)
  return row?.target_count || 1
}

const getTodoCurrentCount = (todoId: string) => {
  if (!selectedCharacter.value) return 0
  const latestMap = getLatestTodoCharacterMap(todoCharacters.value)
  const row = latestMap.get(todoId)
  return row?.current_count || 0
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
    weekend: '주말'
  }
  return labels[cycle as keyof typeof labels] || cycle
}

// 완료 시간 표시
const getCompletedTime = (todoId: string) => {
  if (!selectedCharacter.value) return ''
  const latestMap = getLatestTodoCharacterMap(todoCharacters.value)
  const row = latestMap.get(todoId)
  if (!row?.is_completed || !row.completed_at) return ''
  const completedDate = new Date(row.completed_at)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - completedDate.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return '방금 전'
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}시간 전`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}일 전`
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
  return pendingState !== undefined ? pendingState.isAssigned : currentState
}

// 토글 선택 (실제 적용은 하지 않고 상태만 변경)
const toggleTodoSelection = (todoId: string) => {
  const currentState = isTodoAssigned(todoId)
  const pendingState = pendingChanges.value.get(todoId)
  
  // 현재 실제 상태
  const actualState = pendingState !== undefined ? pendingState.isAssigned : currentState
  
  // 기존 공유 설정 유지하거나 기본값 설정
  const currentShared = pendingState?.isShared ?? false
  
  // 반대 상태로 변경
  pendingChanges.value.set(todoId, {
    isAssigned: !actualState,
    isShared: currentShared
  })
}

// 개별 todo의 공유 설정 토글
const toggleShareWithGuild = (todoId: string) => {
  const pendingState = pendingChanges.value.get(todoId)
  const currentState = isTodoAssigned(todoId)
  
  // 현재 상태 가져오기
  const currentAssigned = pendingState?.isAssigned ?? currentState
  
  // pendingState가 있으면 그 값을 사용, 없으면 데이터베이스에서 현재 값 가져오기
  let currentShared: boolean
  if (pendingState) {
    currentShared = pendingState.isShared
  } else {
    const todoCharacter = todoCharacters.value.find(tc => tc.todo_id === todoId)
    currentShared = todoCharacter?.is_shared ?? false
  }
  
  console.log(`toggleShareWithGuild(${todoId}):`, {
    pendingState: pendingState,
    currentState: currentState,
    currentAssigned: currentAssigned,
    currentShared: currentShared,
    newShared: !currentShared
  })
  
  // 공유 설정만 토글
  pendingChanges.value.set(todoId, {
    isAssigned: currentAssigned,
    isShared: !currentShared
  })
}

// 개별 todo의 공유 설정 상태 가져오기
const getShareWithGuildState = (todoId: string) => {
  const pendingState = pendingChanges.value.get(todoId)
  if (pendingState) {
    console.log(`getShareWithGuildState(${todoId}): pendingState.isShared = ${pendingState.isShared}`)
    return pendingState.isShared
  }
  
  // 현재 할당된 상태에서 공유 설정 확인
  const todoCharacter = todoCharacters.value.find(tc => tc.todo_id === todoId)
  const result = todoCharacter?.is_shared ?? false
  console.log(`getShareWithGuildState(${todoId}): todoCharacter?.is_shared = ${todoCharacter?.is_shared}, result = ${result}`)
  return result
}

// 모두할당하기
const selectAllTodos = () => {
  for (const todo of filteredTodos.value) {
    pendingChanges.value.set(todo.id, {
      isAssigned: true,
      isShared: false
    })
  }
}

// 모두해제하기
const unselectAllTodos = () => {
  for (const todo of filteredTodos.value) {
    pendingChanges.value.set(todo.id, {
      isAssigned: false,
      isShared: false
    })
  }
}

// 변경사항 적용하기
const applyChanges = async () => {
  if (!selectedCharacter.value || assigning.value || pendingChanges.value.size === 0) return

  assigning.value = true
  try {
    const promises: Promise<any>[] = []
    
    for (const [todoId, change] of pendingChanges.value) {
      const currentState = isTodoAssigned(todoId)
      
      console.log(`applyChanges for ${todoId}:`, {
        change: change,
        currentState: currentState,
        isAssignedChanged: change.isAssigned !== currentState,
        isAssignedAndCurrent: change.isAssigned && currentState
      })
      
      if (change.isAssigned !== currentState) {
        if (change.isAssigned) {
          // 할당
          console.log(`POST 요청: is_shared = ${change.isShared}`)
          promises.push(
            $fetch<any>(`/api/todos/${todoId}/characters/${selectedCharacter.value!.id}` as any, {
              method: 'POST',
              body: {
                is_shared: change.isShared
              }
            }) as Promise<any>
          )
        } else {
          // 해제
          promises.push(
            $fetch<any>(`/api/todos/${todoId}/characters/${selectedCharacter.value!.id}` as any, {
              method: 'DELETE'
            }) as Promise<any>
          )
        }
      } else if (change.isAssigned && currentState) {
        // 할당 상태는 유지하지만 공유 설정만 변경
        console.log(`PUT 요청: is_shared = ${change.isShared}`)
        promises.push(
          $fetch<any>(`/api/todos/${todoId}/characters/${selectedCharacter.value!.id}` as any, {
            method: 'PUT',
            body: {
              is_shared: change.isShared
            }
          }) as Promise<any>
        )
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

// 소스 캐릭터의 숙제 목록 가져오기
const loadSourceCharacterTodos = async () => {
  if (!selectedSourceCharacter.value) {
    sourceCharacterTodos.value = []
    return
  }

  try {
    const response = await $fetch(`/api/characters/${selectedSourceCharacter.value}/todos`, {
      method: 'GET'
    })

    if (response.success) {
      const allTodoCharacters = (response.todoCharacters || []) as Array<any>

      // todo_id 기준으로 유니크 처리 (가장 먼저 등장한 항목 기준)
      const uniqueTodoCharacters = Array.from(
        new Map(allTodoCharacters.map((tc: any) => [tc.todo_id, tc])).values()
      )

      // todo 정보와 함께 매핑
      const todosWithInfo = uniqueTodoCharacters.map((tc: any) => {
        const todo = todos.value.find(t => t.id === tc.todo_id)
        return {
          id: tc.todo_id, // 목록 키를 todo_id로 통일
          todo_id: tc.todo_id,
          title: todo?.title || '알 수 없는 숙제',
          repeat_cycle: (todo?.repeat_cycle as string) || 'daily',
          is_shared: !!tc.is_shared
        }
      })

      sourceCharacterTodos.value = todosWithInfo
    }
  } catch (error) {
    console.error('Error loading source character todos:', error)
    sourceCharacterTodos.value = []
  }
}

// 소스 캐릭터 선택 변경 감지
watch(selectedSourceCharacter, () => {
  loadSourceCharacterTodos()
})

// 완료된 숙제 되돌리기
const undoCompletedTodo = async (todoId: string) => {
  if (!selectedCharacter.value) return

  if (!confirm('정말로 이 숙제의 완료 상태를 되돌리시겠습니까?')) {
    return
  }

  try {
    const response = await $fetch(`/api/todos/${todoId}/characters/${selectedCharacter.value.id}`, {
      method: 'PUT',
      body: {
        is_completed: false
      }
    })

    if (response.success) {
      await loadTodoCharacters()
      console.log('숙제 완료 상태가 되돌려졌습니다.')
    } else {
      alert('숙제 되돌리기에 실패했습니다.')
    }
  } catch (error) {
    console.error('Error undoing completed todo:', error)
    alert('숙제 되돌리기 중 오류가 발생했습니다.')
  }
}

// 숙제 복사 실행
const copyTodos = async () => {
  if (!selectedCharacter.value || !selectedSourceCharacter.value || copying.value) return

  copying.value = true
  try {
    const response = await $fetch(`/api/characters/${selectedCharacter.value.id}/copy-todos`, {
      method: 'POST',
      body: {
        sourceCharacterId: selectedSourceCharacter.value
      }
    })

    if (response.success) {
      await loadTodoCharacters()
      showCopyModal.value = false
      selectedSourceCharacter.value = ''
      sourceCharacterTodos.value = []
      alert(response.message || '숙제가 성공적으로 복사되었습니다.')
    }
  } catch (error: any) {
    console.error('Error copying todos:', error)
    alert(error.data?.statusMessage || '숙제 복사에 실패했습니다.')
  } finally {
    copying.value = false
  }
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

<style scoped>
/* 슬라이드 아웃 애니메이션 */
.slide-out-enter-active,
.slide-out-leave-active {
  transition: all 0.6s ease-out;
}

.slide-out-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-out-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.slide-out-move {
  transition: transform 0.6s ease-out;
}

/* 슬라이드 인 애니메이션 */
.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.6s ease-out;
}

.slide-in-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-in-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-in-move {
  transition: transform 0.6s ease-out;
}

/* 모바일 터치 최적화 */
@media (max-width: 640px) {
  .slide-out-enter-active,
  .slide-out-leave-active,
  .slide-in-enter-active,
  .slide-in-leave-active {
    transition: all 0.5s ease-out;
  }
  
  .slide-out-move,
  .slide-in-move {
    transition: transform 0.5s ease-out;
  }
}
</style> 