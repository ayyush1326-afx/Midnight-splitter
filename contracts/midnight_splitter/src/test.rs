#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token::StellarAssetClient, Address, Env, Vec};

fn create_token_contract<'a>(env: &Env, admin: &Address) -> (Address, StellarAssetClient<'a>) {
    let token_address = env.register_stellar_asset_contract_v2(admin.clone());
    let token_client = StellarAssetClient::new(env, &token_address.address());
    (token_address.address(), token_client)
}

#[test]
fn test_get_version() {
    let env = Env::default();
    let contract_id = env.register(MidnightSplitterContract, ());
    let client = MidnightSplitterContractClient::new(&env, &contract_id);

    assert_eq!(client.get_version(), 1);
}

#[test]
fn test_calculate_equal_split() {
    let env = Env::default();
    let contract_id = env.register(MidnightSplitterContract, ());
    let client = MidnightSplitterContractClient::new(&env, &contract_id);

    // Test 100 split by 4
    let preview = client.calculate_equal_split(&100, &4);
    assert_eq!(preview.per_recipient_share, 25);
    assert_eq!(preview.total_transferred, 100);
    assert_eq!(preview.dust, 0);
    assert_eq!(preview.recipient_count, 4);

    // Test 100 split by 3 (dust remainder = 1)
    let preview_dust = client.calculate_equal_split(&100, &3);
    assert_eq!(preview_dust.per_recipient_share, 33);
    assert_eq!(preview_dust.total_transferred, 99);
    assert_eq!(preview_dust.dust, 1);
    assert_eq!(preview_dust.recipient_count, 3);
}

#[test]
fn test_split_equal_even() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MidnightSplitterContract, ());
    let splitter_client = MidnightSplitterContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let recipient3 = Address::generate(&env);
    let recipient4 = Address::generate(&env);

    let admin = Address::generate(&env);
    let (token_address, token_client) = create_token_contract(&env, &admin);

    // Mint 1,000 tokens to sender
    token_client.mint(&sender, &1000);
    assert_eq!(token_client.balance(&sender), 1000);

    let mut recipients = Vec::new(&env);
    recipients.push_back(recipient1.clone());
    recipients.push_back(recipient2.clone());
    recipients.push_back(recipient3.clone());
    recipients.push_back(recipient4.clone());

    // Execute split: 1000 split across 4 recipients = 250 each
    let summary = splitter_client.split_equal(&sender, &token_address, &recipients, &1000);

    assert_eq!(summary.total_amount, 1000);
    assert_eq!(summary.per_recipient_share, 250);
    assert_eq!(summary.total_transferred, 1000);
    assert_eq!(summary.dust, 0);
    assert_eq!(summary.recipient_count, 4);

    // Verify balances
    assert_eq!(token_client.balance(&sender), 0);
    assert_eq!(token_client.balance(&recipient1), 250);
    assert_eq!(token_client.balance(&recipient2), 250);
    assert_eq!(token_client.balance(&recipient3), 250);
    assert_eq!(token_client.balance(&recipient4), 250);
}

#[test]
fn test_split_equal_with_dust_retention() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MidnightSplitterContract, ());
    let splitter_client = MidnightSplitterContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let recipient3 = Address::generate(&env);

    let admin = Address::generate(&env);
    let (token_address, token_client) = create_token_contract(&env, &admin);

    // Mint 100 tokens to sender
    token_client.mint(&sender, &100);

    let mut recipients = Vec::new(&env);
    recipients.push_back(recipient1.clone());
    recipients.push_back(recipient2.clone());
    recipients.push_back(recipient3.clone());

    // 100 / 3 = 33 each, dust = 1 stays with sender
    let summary = splitter_client.split_equal(&sender, &token_address, &recipients, &100);

    assert_eq!(summary.total_amount, 100);
    assert_eq!(summary.per_recipient_share, 33);
    assert_eq!(summary.total_transferred, 99);
    assert_eq!(summary.dust, 1);
    assert_eq!(summary.recipient_count, 3);

    // Sender retains 1 dust token
    assert_eq!(token_client.balance(&sender), 1);
    assert_eq!(token_client.balance(&recipient1), 33);
    assert_eq!(token_client.balance(&recipient2), 33);
    assert_eq!(token_client.balance(&recipient3), 33);
}

#[test]
fn test_split_weighted() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MidnightSplitterContract, ());
    let splitter_client = MidnightSplitterContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);
    let recipient3 = Address::generate(&env);

    let admin = Address::generate(&env);
    let (token_address, token_client) = create_token_contract(&env, &admin);

    token_client.mint(&sender, &10000);

    let mut recipients = Vec::new(&env);
    recipients.push_back(recipient1.clone());
    recipients.push_back(recipient2.clone());
    recipients.push_back(recipient3.clone());

    // 50% (5000 bps), 30% (3000 bps), 20% (2000 bps)
    let mut weights = Vec::new(&env);
    weights.push_back(5000);
    weights.push_back(3000);
    weights.push_back(2000);

    let summary = splitter_client.split_weighted(
        &sender,
        &token_address,
        &recipients,
        &weights,
        &10000,
    );

    assert_eq!(summary.total_amount, 10000);
    assert_eq!(summary.total_transferred, 10000);
    assert_eq!(summary.dust, 0);
    assert_eq!(summary.recipient_count, 3);

    assert_eq!(token_client.balance(&recipient1), 5000);
    assert_eq!(token_client.balance(&recipient2), 3000);
    assert_eq!(token_client.balance(&recipient3), 2000);
    assert_eq!(token_client.balance(&sender), 0);
}

#[test]
fn test_split_custom() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MidnightSplitterContract, ());
    let splitter_client = MidnightSplitterContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient1 = Address::generate(&env);
    let recipient2 = Address::generate(&env);

    let admin = Address::generate(&env);
    let (token_address, token_client) = create_token_contract(&env, &admin);

    token_client.mint(&sender, &500);

    let mut payouts = Vec::new(&env);
    payouts.push_back(Payout {
        recipient: recipient1.clone(),
        amount: 320,
    });
    payouts.push_back(Payout {
        recipient: recipient2.clone(),
        amount: 180,
    });

    let summary = splitter_client.split_custom(&sender, &token_address, &payouts);

    assert_eq!(summary.total_amount, 500);
    assert_eq!(summary.total_transferred, 500);
    assert_eq!(summary.recipient_count, 2);

    assert_eq!(token_client.balance(&recipient1), 320);
    assert_eq!(token_client.balance(&recipient2), 180);
    assert_eq!(token_client.balance(&sender), 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_empty_recipients_error() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MidnightSplitterContract, ());
    let splitter_client = MidnightSplitterContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let token = Address::generate(&env);
    let recipients = Vec::new(&env);

    splitter_client.split_equal(&sender, &token, &recipients, &100);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_zero_amount_error() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MidnightSplitterContract, ());
    let splitter_client = MidnightSplitterContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    let mut recipients = Vec::new(&env);
    recipients.push_back(recipient);

    splitter_client.split_equal(&sender, &token, &recipients, &0);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")]
fn test_invalid_weights_sum_error() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(MidnightSplitterContract, ());
    let splitter_client = MidnightSplitterContractClient::new(&env, &contract_id);

    let sender = Address::generate(&env);
    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);
    let token = Address::generate(&env);

    let mut recipients = Vec::new(&env);
    recipients.push_back(r1);
    recipients.push_back(r2);

    let mut weights = Vec::new(&env);
    weights.push_back(4000);
    weights.push_back(4000); // 8000 != 10000 bps

    splitter_client.split_weighted(&sender, &token, &recipients, &weights, &1000);
}
