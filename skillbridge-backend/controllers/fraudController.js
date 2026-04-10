import supabase from '../utils/supabase.js';

const getDaysSince = (dateValue) => {
  if (!dateValue) return 0;

  const createdAt = new Date(dateValue);
  if (Number.isNaN(createdAt.getTime())) {
    return 0;
  }

  const diffMs = Date.now() - createdAt.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

export const checkFraudRules = async (userId) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile) {
      throw new Error('Profile not found for fraud check');
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from('credits_ledger')
      .select('id, from_user, to_user, amount, type, created_at')
      .or(`from_user.eq.${userId},to_user.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (transactionsError) throw transactionsError;

    const creditTransactions = transactions || [];
    const creditsEarned = creditTransactions
      .filter((item) => item.to_user === userId && item.type === 'earned')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const creditsSpent = creditTransactions
      .filter((item) => item.from_user === userId && item.type === 'spent')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const accountAge = getDaysSince(profile.created_at);
    const latestTransactionAmount = Number(creditTransactions[0]?.amount) || 0;
    const reasons = [];

    if (creditsEarned > 5 * creditsSpent) {
      reasons.push({
        rule: 'credits_earned_gt_5x_spent',
        values: {
          credits_earned: creditsEarned,
          credits_spent: creditsSpent
        }
      });
    }

    if (accountAge < 7 && latestTransactionAmount > 200) {
      reasons.push({
        rule: 'new_account_large_transaction',
        values: {
          account_age: accountAge,
          latest_transaction: latestTransactionAmount
        }
      });
    }

    if (reasons.length > 0) {
      const alerts = reasons.map((reason) => ({
        user_id: userId,
        alert_type: 'rule_triggered',
        details: reason
      }));

      const { error: alertError } = await supabase
        .from('fraud_alerts')
        .insert(alerts);

      if (alertError) throw alertError;

      return {
        is_flagged: true,
        reasons
      };
    }

    return { is_flagged: false };
  } catch (error) {
    throw new Error(`Fraud check failed: ${error.message}`);
  }
};
