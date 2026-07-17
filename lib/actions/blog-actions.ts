'use server';

import {
  listPosts as _listPosts,
  getPost as _getPost,
  upsertPost as _upsertPost,
  deletePost as _deletePost,
} from '@/lib/services/blog-service';
import type { PostListInput } from '@/lib/validation/blog';

/**
 * Server Action boundary for the Blog CMS module.
 *
 * Next.js requires every export from a `'use server'` file to itself be an
 * async function declaration — re-exporting an already-defined async function
 * from another module does not satisfy this (it fails at build time with
 * "Only async functions are allowed to be exported in a 'use server' file").
 * Each action here is therefore its own async function that forwards directly
 * to the corresponding service function, preserving the exact same signature
 * and behavior as a thin pass-through.
 */
export async function listPosts(input: PostListInput) {
  return _listPosts(input);
}

export async function getPost(id: string) {
  return _getPost(id);
}

export async function upsertPost(input: unknown) {
  return _upsertPost(input);
}

export async function deletePost(id: string) {
  return _deletePost(id);
}
