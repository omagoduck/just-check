-- Create a function to atomically deduct allowance with clamping to 0
CREATE OR REPLACE FUNCTION deduct_allowance(
  p_clerk_user_id TEXT,
  p_cost_cents INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_new_allowance INTEGER;
BEGIN
  -- Update the allowance atomically with row-level lock
  UPDATE periodic_allowance
  SET remaining_allowance = GREATEST(remaining_allowance - p_cost_cents, 0)
  WHERE clerk_user_id = p_clerk_user_id
  RETURNING remaining_allowance INTO v_new_allowance;
  
  -- Return the new allowance (NULL if no row exists)
  RETURN v_new_allowance;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION deduct_allowance(TEXT, INTEGER) TO service_role;
