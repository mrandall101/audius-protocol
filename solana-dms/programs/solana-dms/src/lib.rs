use anchor_lang::prelude::*;

declare_id!("F5ZaCxEgNuiR5buHmRChHAcChVvMzAHR9nqS5JFyDhEM");

#[program]
pub mod solana_dms {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[account]
pub struct Tweet {
  pub author: Pubkey,
  pub timestamp: i64,
  pub topic: String,
  pub content: String
}