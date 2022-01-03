use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("F5ZaCxEgNuiR5buHmRChHAcChVvMzAHR9nqS5JFyDhEM");

#[program]
pub mod solana_dms {
    use super::*;
    pub fn send_tweet(ctx: Context<SendTweet>, topic: String, content: String) -> ProgramResult {
      let tweet: &mut Account<Tweet> = &mut ctx.accounts.tweet;
      let author: &Signer = &ctx.accounts.author;
      let clock: Clock = Clock::get().unwrap();

      if topic.chars().count() > 50 {
        return Err(ErrorCode::TopicTooLong.into())
      }

      if content.chars().count() > 280 {
        return Err(ErrorCode::ContentTooLong.into())
      }

      tweet.author = *author.key;
      tweet.timestamp = clock.unix_timestamp;
      tweet.topic = topic;
      tweet.content = content;
      Ok(())
    }
}

#[derive(Accounts)]
pub struct SendTweet<'info> {
  #[account(init, payer = author, space = Tweet::LEN)]
  pub tweet: Account<'info, Tweet>,
  #[account(mut)]
  pub author: Signer<'info>.
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
}

#[account]
pub struct Tweet {
  pub author: Pubkey,
  pub timestamp: i64,
  pub topic: String,
  pub content: String
}

// in bytes
const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const TIMESTAMP_LENGTH: usize = 8;
const STRING_LENGTH_PREFIX: usize = 4;
const MAX_TOPIC_LENGTH: usize = 50 * 4; // 50 chars, 4 bytes per UTF-8 char
const MAX_CONTENT_LENGTH: usize = 280 * 4; // 280 chars, 4 bytes per UTF-8 char

// Define constant on Tweet account to access its total size
impl Tweet {
  const LEN: usize = DISCRIMINATOR_LENGTH
    + PUBLIC_KEY_LENGTH // author
    + TIMESTAMP_LENGTH  // timestamp
    + STRING_LENGTH_PREFIX + MAX_TOPIC_LENGTH // topic
    + STRING_LENGTH_PREFIX + MAX_CONTENT_LENGTH // content
}

#[error]
pub enum ErrorCode {
  #[msg("The provided topic should be 50 chars at most")]
  TopicTooLong,
  #[msg("The provided content should be 280 chars at most")]
  ContentTooLong
}