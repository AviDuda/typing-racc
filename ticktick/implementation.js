// src/utils/error.ts
var writeAccessDeniedResponse = {
  success: false,
  error: "Write access denied to this project",
  canTryAnotherApproach: false
};
function isError(error) {
  return error instanceof Error;
}
function getErrorMessage(error) {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error occurred";
}

// src/plugins/ticktick/constants.ts
var API_TIMEOUT = 5000;
var baseUrl = "https://api.ticktick.com/open/v1";

// src/plugins/ticktick/lib/cache.ts
var projectsCache = null;
function getCachedProjects() {
  if (!projectsCache) {
    return null;
  }
  const isValid = projectsCache && Date.now() - projectsCache.timestamp < CACHE_PROJECTS_TTL;
  return isValid ? projectsCache.data : null;
}
function setCachedProjects(data) {
  if (!data) {
    projectsCache = null;
    return;
  }
  projectsCache = {
    data,
    timestamp: Date.now()
  };
}
var CACHE_PROJECTS_TTL = 60 * 1000;

// src/utils/string.ts
function normalizeString(str) {
  return str.normalize("NFKD").replace(/\p{Diacritic}/gu, "").replace(/[\u{1F300}-\u{1F9FF}]/gu, "").replace(/[\u{1F600}-\u{1F64F}]/gu, "").replace(/[\u{2700}-\u{27BF}]/gu, "").toLowerCase().trim();
}
var whitespaceRegex = /\s+/;
function calculateSimilarity(str1, str2) {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  if (norm1 === norm2) {
    return 1;
  }
  const containsScore = norm1.includes(norm2) || norm2.includes(norm1) ? 0.8 : 0;
  const words1 = new Set(norm1.split(whitespaceRegex));
  const words2 = new Set(norm2.split(whitespaceRegex));
  const commonWords = [...words1].filter((word) => words2.has(word));
  const wordScore = commonWords.length / Math.max(words1.size, words2.size);
  const lengthDiff = Math.abs(norm1.length - norm2.length);
  const lengthPenalty = 1 - lengthDiff / Math.max(norm1.length, norm2.length);
  const score = Math.max(containsScore * 0.6 + lengthPenalty * 0.4, wordScore * 0.7 + lengthPenalty * 0.3);
  return score;
}

// src/plugins/ticktick/utils/api.ts
function isRetriableError(statusCode) {
  return statusCode !== 401 && statusCode < 500;
}
function buildRequestHeaders(userSettings) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userSettings.accessKey}`
  };
}

// src/plugins/ticktick/commands/projects/getProjects.ts
async function commandGetProjects(userSettings) {
  const projectsCache2 = getCachedProjects();
  if (projectsCache2) {
    return { success: true, data: projectsCache2 };
  }
  try {
    const response = await fetch(`${baseUrl}/project`, {
      headers: buildRequestHeaders(userSettings),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: isRetriableError(response.status)
      };
    }
    const data = await response.json();
    setCachedProjects(data);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch projects: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ticktick/commands/tasks/getProjectTasks.ts
async function commandGetProjectTasks(params, userSettings) {
  if (!(params.projectId || params.projectName)) {
    return {
      success: false,
      error: "projectId or projectName is required",
      canTryAnotherApproach: true
    };
  }
  try {
    let projectId = params.projectId;
    if (!projectId) {
      const projectsResponse = await commandGetProjects(userSettings);
      if (!projectsResponse.success) {
        return projectsResponse;
      }
      const project = projectsResponse.data.find((p) => p.name === params.projectName);
      if (!project) {
        return {
          success: false,
          error: `Project not found: ${params.projectName}`,
          canTryAnotherApproach: true
        };
      }
      projectId = project.id;
    }
    const response = await fetch(`${baseUrl}/project/${projectId}/data`, {
      headers: buildRequestHeaders(userSettings),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: isRetriableError(response.status)
      };
    }
    const data = await response.json();
    if (data.tasks) {
      for (const task of data.tasks) {
        if (task.completedTime && Number.isInteger(task.completedTime)) {
          task.completedTime = new Date(task.completedTime).toISOString();
        }
        if (task.items) {
          for (const item of task.items) {
            if (item.completedTime && Number.isInteger(item.completedTime)) {
              item.completedTime = new Date(item.completedTime).toISOString();
            }
          }
        }
      }
    }
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch project tasks: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ticktick/lib/projects.ts
async function getProjectIdByName(projectName, userSettings) {
  const projectsResponse = await commandGetProjects(userSettings);
  if (!projectsResponse.success) {
    return projectsResponse;
  }
  let bestMatch = null;
  let bestScore = 0;
  const MINIMUM_SCORE = 0.5;
  for (const project of projectsResponse.data) {
    const score = calculateSimilarity(project.name, projectName);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = project;
    }
    if (score === 1) {
      break;
    }
  }
  if (!bestMatch || bestScore < MINIMUM_SCORE) {
    return {
      success: false,
      error: `Project not found: ${projectName}`,
      canTryAnotherApproach: true
    };
  }
  return { success: true, data: bestMatch.id };
}
async function findProjectIdFromTaskReference(taskIdOrName, userSettings) {
  try {
    const projectsResponse = await commandGetProjects(userSettings);
    if (!projectsResponse.success) {
      return projectsResponse;
    }
    const sortedProjects = [...projectsResponse.data].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const project of sortedProjects) {
      const tasksResponse = await commandGetProjectTasks({
        command: "get_project_tasks",
        projectId: project.id
      }, userSettings);
      if (!tasksResponse.success) {
        continue;
      }
      if (tasksResponse.data.tasks.some((task) => task.id === taskIdOrName)) {
        return { success: true, data: project.id };
      }
    }
    let bestMatch = {
      projectId: null,
      score: 0
    };
    const MINIMUM_SCORE = 0.5;
    for (const project of sortedProjects) {
      const tasksResponse = await commandGetProjectTasks({
        command: "get_project_tasks",
        projectId: project.id
      }, userSettings);
      if (!tasksResponse.success) {
        continue;
      }
      for (const task of tasksResponse.data.tasks) {
        const score = calculateSimilarity(task.title, taskIdOrName);
        if (score > bestMatch.score) {
          bestMatch = { projectId: project.id, score };
        }
        if (score === 1) {
          break;
        }
      }
    }
    if (bestMatch.projectId && bestMatch.score >= MINIMUM_SCORE) {
      return { success: true, data: bestMatch.projectId };
    }
    return {
      success: false,
      error: `No task found matching ID or name: ${taskIdOrName}`,
      canTryAnotherApproach: false
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get project ID: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}
async function checkWritePermission(projectId, userSettings) {
  if (!userSettings.allowedProjects) {
    return { success: true, data: true };
  }
  const allowedProjects = userSettings.allowedProjects.split(",").map((p) => p.trim());
  if (allowedProjects.length === 0) {
    return { success: true, data: true };
  }
  if (allowedProjects.includes(projectId)) {
    return { success: true, data: true };
  }
  const projectsResponse = await commandGetProjects(userSettings);
  if (!projectsResponse.success) {
    return projectsResponse;
  }
  const projects = projectsResponse.data;
  const targetProject = projects.find((p) => p.id === projectId);
  if (!targetProject) {
    return {
      success: false,
      error: "Project not found",
      canTryAnotherApproach: true
    };
  }
  for (const allowedProject of allowedProjects) {
    if (calculateSimilarity(targetProject.name, allowedProject) >= 0.8) {
      return { success: true, data: true };
    }
  }
  return {
    success: false,
    error: `Writing to project "${targetProject.name}" is not allowed. Allowed projects: ${userSettings.allowedProjects}`,
    canTryAnotherApproach: false
  };
}
async function checkProjectModificationPermission(userSettings, operation, projectId) {
  if (userSettings.allowProjectModification !== "yes") {
    return {
      success: false,
      error: `Project ${operation} is not allowed`,
      canTryAnotherApproach: false
    };
  }
  if (projectId && operation !== "creation") {
    const permissionCheck = await checkWritePermission(projectId, userSettings);
    if (!permissionCheck.success) {
      return permissionCheck;
    }
    if (!permissionCheck.data) {
      return writeAccessDeniedResponse;
    }
  }
  return { success: true, data: true };
}

// src/plugins/ticktick/commands/projects/createProject.ts
async function commandCreateProject(params, userSettings) {
  const permissionCheck = await checkProjectModificationPermission(userSettings, "creation");
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  if (!params.projectData?.name) {
    return {
      success: false,
      error: "projectData with name is required",
      canTryAnotherApproach: true
    };
  }
  try {
    const response = await fetch(`${baseUrl}/project`, {
      method: "POST",
      headers: buildRequestHeaders(userSettings),
      body: JSON.stringify(params.projectData),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: isRetriableError(response.status)
      };
    }
    const data = await response.json();
    setCachedProjects(null);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create project: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ticktick/commands/projects/deleteProject.ts
async function commandDeleteProject(params, userSettings) {
  let projectId = params.projectId;
  if (!projectId && params.projectName) {
    const projectIdResponse = await getProjectIdByName(params.projectName, userSettings);
    if (!projectIdResponse.success) {
      return projectIdResponse;
    }
    projectId = projectIdResponse.data;
  }
  if (!projectId) {
    return {
      success: false,
      error: "projectId or projectName is required",
      canTryAnotherApproach: true
    };
  }
  const permissionCheck = await checkProjectModificationPermission(userSettings, "deletion", projectId);
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  try {
    const projectTasks = await commandGetProjectTasks({ command: "get_project_tasks", projectId }, userSettings);
    if (!projectTasks.success) {
      return projectTasks;
    }
    if (projectTasks.data.tasks && projectTasks.data.tasks.length > 0) {
      return {
        success: false,
        error: `Cannot delete project that has ${projectTasks.data.tasks.length} tasks. Remove all tasks from the project first.`,
        canTryAnotherApproach: false
      };
    }
    const response = await fetch(`${baseUrl}/project/${projectId}`, {
      method: "DELETE",
      headers: buildRequestHeaders(userSettings),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: isRetriableError(response.status)
      };
    }
    setCachedProjects(null);
    return { success: true, data: `Project ${projectId} deleted` };
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete project: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ticktick/commands/projects/getProjectById.ts
async function commandGetProjectById(params, userSettings) {
  let projectId = params.projectId;
  if (!projectId && params.projectName) {
    const projectIdResponse = await getProjectIdByName(params.projectName, userSettings);
    if (!projectIdResponse.success) {
      return projectIdResponse;
    }
    projectId = projectIdResponse.data;
  }
  if (!projectId) {
    return {
      success: false,
      error: "projectId or projectName is required",
      canTryAnotherApproach: true
    };
  }
  try {
    const response = await fetch(`${baseUrl}/project/${projectId}`, {
      headers: buildRequestHeaders(userSettings),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: isRetriableError(response.status)
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch project: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ticktick/commands/projects/updateProject.ts
async function commandUpdateProject(params, userSettings) {
  if (!params.projectData) {
    return {
      success: false,
      error: "projectData is required",
      canTryAnotherApproach: true
    };
  }
  if (params.projectId && !params.projectData.id) {
    params.projectData.id = params.projectId;
  }
  if (!params.projectData.id && params.projectName) {
    const projectIdResponse = await getProjectIdByName(params.projectName, userSettings);
    if (!projectIdResponse.success) {
      return projectIdResponse;
    }
    params.projectData.id = projectIdResponse.data;
  }
  if (!params.projectData.id) {
    return {
      success: false,
      error: "Project ID is required (either in projectData.id, params.projectId, or via params.projectName)",
      canTryAnotherApproach: true
    };
  }
  const permissionCheck = await checkProjectModificationPermission(userSettings, "modification", params.projectData.id);
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  try {
    const response = await fetch(`${baseUrl}/project/${params.projectData.id}`, {
      method: "POST",
      headers: buildRequestHeaders(userSettings),
      body: JSON.stringify(params.projectData),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: isRetriableError(response.status)
      };
    }
    const data = await response.json();
    setCachedProjects(null);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to update project: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ticktick/commands/tasks/completeTask.ts
async function commandCompleteTask(params, userSettings) {
  const taskId = params.taskId;
  let projectId = params.projectId;
  if (!taskId) {
    return {
      success: false,
      error: "taskId is required",
      canTryAnotherApproach: true
    };
  }
  try {
    if (!projectId) {
      if (params.projectName) {
        const projectIdResponse = await getProjectIdByName(params.projectName, userSettings);
        if (!projectIdResponse.success) {
          return projectIdResponse;
        }
        projectId = projectIdResponse.data;
      } else {
        const projectIdResponse = await findProjectIdFromTaskReference(taskId, userSettings);
        if (!projectIdResponse.success) {
          return projectIdResponse;
        }
        projectId = projectIdResponse.data;
      }
    }
    const permissionCheck = await checkWritePermission(projectId, userSettings);
    if (!permissionCheck.success) {
      return permissionCheck;
    }
    if (!permissionCheck.data) {
      return writeAccessDeniedResponse;
    }
    const response = await fetch(`${baseUrl}/project/${projectId}/task/${taskId}/complete`, {
      method: "POST",
      headers: buildRequestHeaders(userSettings),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: isRetriableError(response.status)
      };
    }
    return { success: true, data: `Task ${taskId} completed` };
  } catch (error) {
    return {
      success: false,
      error: `Failed to complete task: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ticktick/commands/tasks/createTask.ts
async function commandCreateTask(params, userSettings) {
  if (!params.taskData?.title) {
    return {
      success: false,
      error: "taskData with title is required",
      canTryAnotherApproach: true
    };
  }
  if (!params.taskData.projectId && params.projectId) {
    params.taskData.projectId = params.projectId;
  }
  if (params.taskData.content && params.taskData.items) {
    return {
      success: false,
      error: "Task cannot have both content and items (subtasks)",
      canTryAnotherApproach: true
    };
  }
  try {
    if (!params.taskData.projectId && params.projectName) {
      const projectIdResponse = await getProjectIdByName(params.projectName, userSettings);
      if (!projectIdResponse.success) {
        return projectIdResponse;
      }
      params.taskData.projectId = projectIdResponse.data;
    }
    if (!params.taskData.projectId) {
      return {
        success: false,
        error: "projectId in taskData is required",
        canTryAnotherApproach: true
      };
    }
    const permissionCheck = await checkWritePermission(params.taskData.projectId, userSettings);
    if (!permissionCheck.success) {
      return permissionCheck;
    }
    if (!permissionCheck.data) {
      return writeAccessDeniedResponse;
    }
    const response = await fetch(`${baseUrl}/task`, {
      method: "POST",
      headers: buildRequestHeaders(userSettings),
      body: JSON.stringify(params.taskData),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: isRetriableError(response.status)
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to create task: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ticktick/commands/tasks/deleteTask.ts
async function commandDeleteTask(params, userSettings) {
  const taskId = params.taskId;
  let projectId = params.projectId;
  if (!taskId) {
    return {
      success: false,
      error: "taskId is required",
      canTryAnotherApproach: true
    };
  }
  try {
    if (!projectId) {
      if (params.projectName) {
        const projectIdResponse = await getProjectIdByName(params.projectName, userSettings);
        if (!projectIdResponse.success) {
          return projectIdResponse;
        }
        projectId = projectIdResponse.data;
      } else {
        const projectIdResponse = await findProjectIdFromTaskReference(taskId, userSettings);
        if (!projectIdResponse.success) {
          return projectIdResponse;
        }
        projectId = projectIdResponse.data;
      }
    }
    const permissionCheck = await checkWritePermission(projectId, userSettings);
    if (!permissionCheck.success) {
      return permissionCheck;
    }
    if (!permissionCheck.data) {
      return writeAccessDeniedResponse;
    }
    const response = await fetch(`${baseUrl}/project/${projectId}/task/${taskId}`, {
      method: "DELETE",
      headers: buildRequestHeaders(userSettings),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: isRetriableError(response.status)
      };
    }
    return { success: true, data: `Task ${taskId} deleted` };
  } catch (error) {
    return {
      success: false,
      error: `Failed to delete task: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ticktick/commands/tasks/updateTask.ts
async function commandUpdateTask(params, userSettings) {
  if (!params.taskData) {
    return {
      success: false,
      error: "taskData is required for update",
      canTryAnotherApproach: true
    };
  }
  if (params.taskId && !params.taskData.id) {
    params.taskData.id = params.taskId;
  }
  if (!params.taskData.id) {
    return {
      success: false,
      error: "taskId is required (either in taskData.id or params.taskId)",
      canTryAnotherApproach: true
    };
  }
  if (params.projectId && !params.taskData.projectId) {
    params.taskData.projectId = params.projectId;
  }
  if (params.taskData.content && params.taskData.items) {
    return {
      success: false,
      error: "Task cannot have both content and items (subtasks)",
      canTryAnotherApproach: true
    };
  }
  try {
    let taskProjectId;
    if (params.taskData.projectId) {
      const currentProjectResponse = await findProjectIdFromTaskReference(params.taskData.id, userSettings);
      if (!currentProjectResponse.success) {
        return currentProjectResponse;
      }
      if (params.taskData.projectId !== currentProjectResponse.data) {
        return {
          success: false,
          error: "Cannot change task's project - create a new task in the target project instead",
          canTryAnotherApproach: false
        };
      }
      taskProjectId = params.taskData.projectId;
    } else {
      const projectIdResponse = await findProjectIdFromTaskReference(params.taskData.id, userSettings);
      if (!projectIdResponse.success) {
        return projectIdResponse;
      }
      taskProjectId = projectIdResponse.data;
    }
    params.taskData.projectId = taskProjectId;
    const permissionCheck = await checkWritePermission(taskProjectId, userSettings);
    if (!permissionCheck.success) {
      return permissionCheck;
    }
    if (!permissionCheck.data) {
      return writeAccessDeniedResponse;
    }
    const response = await fetch(`${baseUrl}/task/${params.taskData.id}`, {
      method: "POST",
      headers: buildRequestHeaders(userSettings),
      body: JSON.stringify(params.taskData),
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
        canTryAnotherApproach: isRetriableError(response.status)
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to update task: ${getErrorMessage(error)}`,
      canTryAnotherApproach: true
    };
  }
}

// src/plugins/ticktick/index.ts
function ticktick_plugin(params, userSettings) {
  switch (params.command) {
    case "get_projects": {
      return commandGetProjects(userSettings);
    }
    case "get_project_by_id": {
      return commandGetProjectById(params, userSettings);
    }
    case "get_project_tasks": {
      return commandGetProjectTasks(params, userSettings);
    }
    case "update_task": {
      return commandUpdateTask(params, userSettings);
    }
    case "create_task": {
      return commandCreateTask(params, userSettings);
    }
    case "complete_task": {
      return commandCompleteTask(params, userSettings);
    }
    case "delete_task": {
      return commandDeleteTask(params, userSettings);
    }
    case "create_project": {
      return commandCreateProject(params, userSettings);
    }
    case "update_project": {
      return commandUpdateProject(params, userSettings);
    }
    case "delete_project": {
      return commandDeleteProject(params, userSettings);
    }
    default: {
      return { success: false, error: "Unknown command" };
    }
  }
}

