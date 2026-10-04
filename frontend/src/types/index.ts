export interface Song {
  _id: string;
  title: string;
  artist: string;
  albumId: string | null;
  imageUrl: string;
  audioUrl: string;
  duration: number;
  createdAt: string,
  updatedAt: string
  releaseYear?: number;
}

export interface Album {
  _id: string;
  title: string;
  artist: string;
  imageUrl: string;
  releaseYear: number;
  songs: Song[];
}

export interface Stats {
  totalSongs: number;
  totalAlbums: number;
  totalUsers: number;
  totalArtists: number;
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  type: "text" | "song";
  song?: Song | null;
}

export interface User {
  _id: string;
  clerkId: string;
  fullName: string;
  imageUrl: string;
}

export interface AlbumSearchResult {
  type: "album";
  _id: string;
  title: string;
  artist: string
  imageUrl: string;
}

export interface SongSearchResult {
  type: "song";
  _id: string;
  title: string;
  artist: string
  imageUrl: string
  albumId: string;
}

export interface AdminRequest {
  _id: string;
  clerkId: string;
  reason: string;
  status: AdminRequestStatus;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: { fullName: string, imageUrl: string } | null;
}

export type AdminRequestStatus = "pending" | "approved" | "rejected";
export type SearchResult = AlbumSearchResult | SongSearchResult;