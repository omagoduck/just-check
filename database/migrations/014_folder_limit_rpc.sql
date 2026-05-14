-- ============================================================================
-- FOLDER LIMIT RPC FUNCTION
-- Atomic folder creation with count check to prevent race conditions
-- Version: 014
-- Created: 2026-05-13
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_folder_with_limit(
  p_clerk_user_id TEXT,
  p_name TEXT,
  p_color TEXT DEFAULT NULL,
  p_max_folders INT DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
  v_folder_id UUID;
BEGIN
  -- Atomic count within the transaction
  SELECT COUNT(*) INTO v_count
  FROM public.conversation_folders
  WHERE clerk_user_id = p_clerk_user_id
    AND deleted_at IS NULL;

  IF v_count >= p_max_folders THEN
    RAISE EXCEPTION 'Folder limit reached (max %). Upgrade your plan for more folders.', p_max_folders;
  END IF;

  -- Insert the folder
  INSERT INTO public.conversation_folders (clerk_user_id, name, color)
  VALUES (p_clerk_user_id, p_name, p_color)
  RETURNING id INTO v_folder_id;

  RETURN v_folder_id;
END;
$$;