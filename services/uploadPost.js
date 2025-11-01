/**
 * Upload-Post Service
 * Handles user profile management and content posting to social media
 * Documentation: https://docs.upload-post.com/
 */

class UploadPostService {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = 'https://api.upload-post.com/api'
  }

  /**
   * Create a user profile in Upload-Post
   * @param {string} username - Unique identifier for the user (use Supabase user ID)
   * @returns {Promise<Object>} - Created user profile
   */
  async createUserProfile(username) {
    const response = await fetch(`${this.baseUrl}/uploadposts/users`, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create user profile: ${error.message || response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Generate a secure JWT URL for user to connect their social accounts
   * @param {string} username - The user's unique identifier
   * @param {Object} options - Optional parameters
   * @param {string} options.redirect_url - URL to redirect after connection
   * @param {string} options.logo_image - Logo URL for branding
   * @param {string} options.redirect_button_text - Text for redirect button
   * @param {Array<string>} options.platforms - List of platforms to show
   * @returns {Promise<Object>} - Object containing access_url
   */
  async generateJwtUrl(username, options = {}) {
    const body = { username, ...options }

    const response = await fetch(`${this.baseUrl}/uploadposts/users/generate-jwt`, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to generate JWT URL: ${error.message || response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Get all user profiles or a specific user's profile
   * @param {string|null} username - Optional username to filter
   * @returns {Promise<Array>} - List of user profiles
   */
  async getUserProfiles(username = null) {
    const url = username 
      ? `${this.baseUrl}/uploadposts/users?username=${username}`
      : `${this.baseUrl}/uploadposts/users`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `ApiKey ${this.apiKey}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to fetch user profiles: ${error.message || response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Upload a video to social platforms
   * @param {Object} params
   * @param {string} params.username - The user's unique identifier
   * @param {Buffer|string} params.video - Video file buffer or path
   * @param {string} params.title - Video title
   * @param {Array<string>} params.platforms - Platforms to post to (e.g., ['tiktok', 'instagram'])
   * @param {string} params.description - Optional video description
   * @returns {Promise<Object>} - Upload response
   */
  async uploadVideo({ username, video, title, platforms, description = '' }) {
    const formData = new FormData()
    formData.append('user', username)
    formData.append('title', title)
    formData.append('description', description)
    
    // Add platforms
    platforms.forEach(platform => {
      formData.append('platform[]', platform)
    })

    // Handle video file
    if (typeof video === 'string') {
      // If video is a path, read the file
      const fs = require('fs')
      const videoBuffer = fs.readFileSync(video)
      formData.append('video', new Blob([videoBuffer]), 'video.mp4')
    } else {
      // If video is already a buffer
      formData.append('video', new Blob([video]), 'video.mp4')
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${this.apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to upload video: ${error.message || response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Upload a photo to social platforms
   * @param {Object} params
   * @param {string} params.username - The user's unique identifier
   * @param {Buffer|string} params.photo - Photo file buffer or path
   * @param {string} params.title - Photo title
   * @param {Array<string>} params.platforms - Platforms to post to
   * @param {string} params.description - Optional photo description
   * @returns {Promise<Object>} - Upload response
   */
  async uploadPhoto({ username, photo, title, platforms, description = '' }) {
    const formData = new FormData()
    formData.append('user', username)
    formData.append('title', title)
    formData.append('description', description)
    
    // Add platforms
    platforms.forEach(platform => {
      formData.append('platform[]', platform)
    })

    // Handle photo file
    if (typeof photo === 'string') {
      const fs = require('fs')
      const photoBuffer = fs.readFileSync(photo)
      formData.append('photo', new Blob([photoBuffer]), 'photo.jpg')
    } else {
      formData.append('photo', new Blob([photo]), 'photo.jpg')
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${this.apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to upload photo: ${error.message || response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Check which platforms a user has connected
   * @param {string} username - The user's unique identifier
   * @returns {Promise<Object>} - User profile with connected platforms
   */
  async getConnectedPlatforms(username) {
    const profiles = await this.getUserProfiles(username)
    
    if (!profiles || profiles.length === 0) {
      throw new Error('User profile not found')
    }

    return profiles[0]
  }
}

export default UploadPostService


