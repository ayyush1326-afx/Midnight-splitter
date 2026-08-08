#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum SplitterError {
    ZeroAmount = 1,
    EmptyRecipients = 2,
    AmountTooSmall = 3,
    MismatchedWeights = 4,
    InvalidWeightsSum = 5,
    InvalidPayoutAmount = 6,
    ZeroWeight = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Payout {
    pub recipient: Address,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SplitSummary {
    pub total_amount: i128,
    pub total_transferred: i128,
    pub per_recipient_share: i128,
    pub dust: i128,
    pub recipient_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SplitPreview {
    pub total_amount: i128,
    pub per_recipient_share: i128,
    pub total_transferred: i128,
    pub dust: i128,
    pub recipient_count: u32,
}

#[contract]
pub struct MidnightSplitterContract;

#[contractimpl]
impl MidnightSplitterContract {
    /// Returns the contract version number.
    pub fn get_version(_env: Env) -> u32 {
        1
    }

    /// Pure calculation helper to preview equal split distribution and dust remainder.
    pub fn calculate_equal_split(
        _env: Env,
        total_amount: i128,
        recipient_count: u32,
    ) -> Result<SplitPreview, SplitterError> {
        if recipient_count == 0 {
            return Err(SplitterError::EmptyRecipients);
        }
        if total_amount <= 0 {
            return Err(SplitterError::ZeroAmount);
        }

        let count_i128 = recipient_count as i128;
        let per_recipient_share = total_amount / count_i128;
        if per_recipient_share == 0 {
            return Err(SplitterError::AmountTooSmall);
        }

        let total_transferred = per_recipient_share * count_i128;
        let dust = total_amount - total_transferred;

        Ok(SplitPreview {
            total_amount,
            per_recipient_share,
            total_transferred,
            dust,
            recipient_count,
        })
    }

    /// Splits an exact total sum equally across N recipient addresses.
    /// Indivisible dust fractions stay safely in the sender's account.
    pub fn split_equal(
        env: Env,
        from: Address,
        token: Address,
        recipients: Vec<Address>,
        total_amount: i128,
    ) -> Result<SplitSummary, SplitterError> {
        // Authenticate the sender
        from.require_auth();

        let recipient_count = recipients.len();
        if recipient_count == 0 {
            return Err(SplitterError::EmptyRecipients);
        }
        if total_amount <= 0 {
            return Err(SplitterError::ZeroAmount);
        }

        let count_i128 = recipient_count as i128;
        let per_recipient_share = total_amount / count_i128;
        if per_recipient_share == 0 {
            return Err(SplitterError::AmountTooSmall);
        }

        let client = token::Client::new(&env, &token);

        // Execute sequential atomic transfers to all recipients
        for recipient in recipients.iter() {
            client.transfer(&from, &recipient, &per_recipient_share);
        }

        let total_transferred = per_recipient_share * count_i128;
        let dust = total_amount - total_transferred;

        // Emit Split event
        env.events().publish(
            (symbol_short!("split_eq"), from.clone(), token.clone()),
            (total_amount, per_recipient_share, dust, recipient_count),
        );

        Ok(SplitSummary {
            total_amount,
            total_transferred,
            per_recipient_share,
            dust,
            recipient_count,
        })
    }

    /// Splits an amount based on basis point weights (10,000 bps = 100.00%).
    pub fn split_weighted(
        env: Env,
        from: Address,
        token: Address,
        recipients: Vec<Address>,
        weights_bps: Vec<u32>,
        total_amount: i128,
    ) -> Result<SplitSummary, SplitterError> {
        from.require_auth();

        let recipient_count = recipients.len();
        if recipient_count == 0 {
            return Err(SplitterError::EmptyRecipients);
        }
        if recipient_count != weights_bps.len() {
            return Err(SplitterError::MismatchedWeights);
        }
        if total_amount <= 0 {
            return Err(SplitterError::ZeroAmount);
        }

        // Validate that weights sum to exactly 10,000 bps (100%)
        let mut total_weight: u32 = 0;
        for w in weights_bps.iter() {
            if w == 0 {
                return Err(SplitterError::ZeroWeight);
            }
            total_weight = total_weight.saturating_add(w);
        }
        if total_weight != 10000 {
            return Err(SplitterError::InvalidWeightsSum);
        }

        let client = token::Client::new(&env, &token);
        let mut total_transferred: i128 = 0;

        for i in 0..recipient_count {
            let recipient = recipients.get(i).unwrap();
            let weight = weights_bps.get(i).unwrap() as i128;
            let share = (total_amount * weight) / 10000;

            if share > 0 {
                client.transfer(&from, &recipient, &share);
                total_transferred += share;
            }
        }

        let dust = total_amount - total_transferred;

        env.events().publish(
            (symbol_short!("split_wt"), from.clone(), token.clone()),
            (total_amount, total_transferred, dust, recipient_count),
        );

        Ok(SplitSummary {
            total_amount,
            total_transferred,
            per_recipient_share: 0, // variable per recipient
            dust,
            recipient_count,
        })
    }

    /// Distributes custom explicit amounts to each recipient in one atomic transaction.
    pub fn split_custom(
        env: Env,
        from: Address,
        token: Address,
        payouts: Vec<Payout>,
    ) -> Result<SplitSummary, SplitterError> {
        from.require_auth();

        let recipient_count = payouts.len();
        if recipient_count == 0 {
            return Err(SplitterError::EmptyRecipients);
        }

        let client = token::Client::new(&env, &token);
        let mut total_amount: i128 = 0;

        for payout in payouts.iter() {
            if payout.amount <= 0 {
                return Err(SplitterError::InvalidPayoutAmount);
            }
            total_amount = total_amount
                .checked_add(payout.amount)
                .ok_or(SplitterError::InvalidPayoutAmount)?;
            client.transfer(&from, &payout.recipient, &payout.amount);
        }

        env.events().publish(
            (symbol_short!("split_cu"), from.clone(), token.clone()),
            (total_amount, recipient_count),
        );

        Ok(SplitSummary {
            total_amount,
            total_transferred: total_amount,
            per_recipient_share: 0,
            dust: 0,
            recipient_count,
        })
    }
}

#[cfg(test)]
mod test;
