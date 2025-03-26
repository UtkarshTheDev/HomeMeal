import { supabase } from './supabaseClient';

export async function getWalletBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.balance || 0;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw error;
  }
}

export async function createTransaction(
  userId: string,
  amount: number,
  type: 'credit' | 'debit',
  orderId?: string,
  paymentMethod?: string
) {
  try {
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError) throw walletError;

    if (type === 'debit' && (wallet?.balance || 0) < amount) {
      throw new Error('Insufficient balance');
    }

    const newBalance = type === 'credit' 
      ? (wallet?.balance || 0) + amount 
      : (wallet?.balance || 0) - amount;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount,
        type,
        status: 'completed',
        order_id: orderId,
        payment_method: paymentMethod,
        transaction_id: `TXN${Date.now()}`,
      });

    if (transactionError) throw transactionError;

    return newBalance;
  } catch (error) {
    console.error('Error processing transaction:', error);
    throw error;
  }
}