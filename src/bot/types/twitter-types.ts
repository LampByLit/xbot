// Twitter API v1.1 Types

export interface TwitterUser {
  id: number
  id_str: string
  name: string
  screen_name: string
  location?: string
  description?: string
  url?: string
  protected: boolean
  followers_count: number
  friends_count: number
  listed_count: number
  created_at: string
  favourites_count: number
  verified: boolean
  statuses_count: number
  profile_image_url_https: string
  profile_banner_url?: string
  default_profile: boolean
  default_profile_image: boolean
  following?: boolean
  follow_request_sent?: boolean
  notifications?: boolean
}

export interface TwitterTweet {
  id: number
  id_str: string
  created_at: string
  text: string
  truncated: boolean
  entities: {
    hashtags: Array<{
      text: string
      indices: [number, number]
    }>
    symbols: Array<{
      text: string
      indices: [number, number]
    }>
    user_mentions: Array<{
      screen_name: string
      name: string
      id: number
      id_str: string
      indices: [number, number]
    }>
    urls: Array<{
      url: string
      expanded_url: string
      display_url: string
      indices: [number, number]
    }>
  }
  source: string
  in_reply_to_status_id?: number
  in_reply_to_status_id_str?: string
  in_reply_to_user_id?: number
  in_reply_to_user_id_str?: string
  in_reply_to_screen_name?: string
  user: TwitterUser
  geo?: any
  coordinates?: any
  place?: any
  contributors?: any
  is_quote_status: boolean
  retweet_count: number
  favorite_count: number
  favorited: boolean
  retweeted: boolean
  possibly_sensitive?: boolean
  lang: string
  retweeted_status?: TwitterTweet
  quoted_status?: TwitterTweet
  quoted_status_id?: number
  quoted_status_id_str?: string
}

export interface TwitterMention {
  id: number
  id_str: string
  created_at: string
  text: string
  user: TwitterUser
  entities: {
    hashtags: Array<{
      text: string
      indices: [number, number]
    }>
    user_mentions: Array<{
      screen_name: string
      name: string
      id: number
      id_str: string
      indices: [number, number]
    }>
  }
  in_reply_to_status_id?: number
  in_reply_to_user_id?: number
  in_reply_to_screen_name?: string
}

export interface TwitterSearchResponse {
  statuses: TwitterTweet[]
  search_metadata: {
    completed_in: number
    max_id: number
    max_id_str: string
    next_results: string
    query: string
    refresh_url: string
    count: number
    since_id: number
    since_id_str: string
  }
}

export interface TwitterPostResponse {
  id: number
  id_str: string
  created_at: string
  text: string
  truncated: boolean
  entities: {
    hashtags: Array<{
      text: string
      indices: [number, number]
    }>
    user_mentions: Array<{
      screen_name: string
      name: string
      id: number
      id_str: string
      indices: [number, number]
    }>
  }
  source: string
  user: TwitterUser
  geo?: any
  coordinates?: any
  place?: any
  contributors?: any
  is_quote_status: boolean
  retweet_count: number
  favorite_count: number
  favorited: boolean
  retweeted: boolean
  lang: string
}

export interface TwitterStreamData {
  id: number
  id_str: string
  created_at: string
  text: string
  user: TwitterUser
  entities: {
    hashtags: Array<{
      text: string
      indices: [number, number]
    }>
    user_mentions: Array<{
      screen_name: string
      name: string
      id: number
      id_str: string
      indices: [number, number]
    }>
  }
  in_reply_to_status_id?: number
  in_reply_to_user_id?: number
  in_reply_to_screen_name?: string
}

export interface TwitterRateLimit {
  limit: number
  remaining: number
  reset: number
}

export interface TwitterError {
  code: number
  message: string
}

// Twitter API Request Types
export interface TwitterPostRequest {
  status: string
  in_reply_to_status_id?: string
  auto_populate_reply_metadata?: boolean
  exclude_reply_user_ids?: string
  attachment_url?: string
  media_ids?: string
  possibly_sensitive?: boolean
  lat?: number
  long?: number
  place_id?: string
  display_coordinates?: boolean
  trim_user?: boolean
  enable_dmcommands?: boolean
  fail_dmcommands?: boolean
  card_uri?: string
}

export interface TwitterSearchRequest {
  q: string
  geocode?: string
  lang?: string
  locale?: string
  result_type?: 'mixed' | 'recent' | 'popular'
  count?: number
  until?: string
  since_id?: string
  max_id?: string
  include_entities?: boolean
}

// Twitter Stream Types
export interface TwitterStreamRequest {
  track?: string
  follow?: string
  locations?: string
  delimited?: boolean
  stall_warnings?: boolean
  filter_level?: 'none' | 'low' | 'medium'
  language?: string
  count?: number
}

export interface TwitterStreamResponse {
  data: TwitterStreamData
  includes?: {
    users?: TwitterUser[]
    tweets?: TwitterTweet[]
  }
  matching_rules?: Array<{
    id: number
    id_str: string
    tag?: string
  }>
} 