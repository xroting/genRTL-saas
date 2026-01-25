-- Fix: Update teams with 'free' plan to 'hobby' plan
-- Reason: SUBSCRIPTION_PLANS in usd-pool.ts doesn't include 'free', only 'hobby'

UPDATE teams 
SET plan_name = 'hobby' 
WHERE plan_name = 'free';

