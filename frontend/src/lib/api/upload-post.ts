/**
 * Upload-post API Client for Frontend
 * Communicates with MCP server for multi-platform posting
 */

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL || 'http://localhost:3000';

export interface PostOptions {
  videoUrl: string;
  platforms: string[];
  captions?: Record<string, string>;
  profileKeys?: string[];
  uploadPostApiKey: string;
}

export interface UploadStatus {
  uploadId: string;
  status: string;
  platformStatuses: Record<string, string>;
  postIds: Record<string, string>;
  errors: Record<string, string>;
  completedAt?: string;
}

export interface Profile {
  profileKey: string;
  platform: string;
  username: string;
  connected: boolean;
  connectedAt: string;
}

/**
 * Post content to multiple platforms
 */
export async function postToMultiplePlatforms(options: PostOptions) {
  const response = await fetch(`${MCP_SERVER_URL}/api/content/post-multi-platform`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to post content');
  }

  return response.json();
}

/**
 * Check upload status
 */
export async function checkUploadStatus(uploadId: string, apiKey: string): Promise<UploadStatus> {
  const response = await fetch(
    `${MCP_SERVER_URL}/api/upload-post/status/${uploadId}?uploadPostApiKey=${encodeURIComponent(apiKey)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to check status');
  }

  const data = await response.json();
  return data as UploadStatus;
}

/**
 * Get OAuth URL for connecting a platform account
 */
export async function getOAuthUrl(platform: string, apiKey: string) {
  const response = await fetch(`${MCP_SERVER_URL}/api/upload-post/connect-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      platform,
      uploadPostApiKey: apiKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get OAuth URL');
  }

  return response.json();
}

/**
 * Complete OAuth callback
 */
export async function completeOAuth(code: string, state: string, apiKey: string) {
  const response = await fetch(`${MCP_SERVER_URL}/api/upload-post/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      state,
      uploadPostApiKey: apiKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to complete OAuth');
  }

  return response.json();
}

/**
 * Get connected profiles
 */
export async function getProfiles(apiKey: string): Promise<Profile[]> {
  const response = await fetch(
    `${MCP_SERVER_URL}/api/upload-post/profiles?uploadPostApiKey=${encodeURIComponent(apiKey)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch profiles');
  }

  const data = await response.json();
  return data.profiles;
}

/**
 * Disconnect a profile
 */
export async function disconnectProfile(profileKey: string, apiKey: string) {
  const response = await fetch(`${MCP_SERVER_URL}/api/upload-post/profiles/${profileKey}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uploadPostApiKey: apiKey,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to disconnect profile');
  }

  return response.json();
}

/**
 * Get post analytics
 */
export async function getPostAnalytics(postId: string, apiKey: string) {
  const response = await fetch(
    `${MCP_SERVER_URL}/api/upload-post/analytics/${postId}?uploadPostApiKey=${encodeURIComponent(apiKey)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch analytics');
  }

  return response.json();
}


















