use anchor_lang::prelude::*;

declare_id!("8Q8qwFoqkEmxEMAvNuXUj2yCcsGesHY915ndjZyufQHH");

#[program]
pub mod counter_program {
    use std::ops::DerefMut;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let c = ctx.accounts.counter.deref_mut();
        let bump = ctx.bumps.counter;
        *c = Counter {
            authority: *ctx.accounts.authority.key,
            count: 0,
            bump,
        };
        return Ok(());
    }
    
    pub fn create_separate_counter(ctx: Context<CreateSeparateCounter>) -> Result<()> { 
        let c = ctx.accounts.counter.deref_mut();
        let bump = ctx.bumps.counter;
        *c = Counter {
            authority: *ctx.accounts.authority.key,
            count: 10,
            bump,
        };
        return Ok(());
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.counter.authority,
        );
        ctx.accounts.counter.count += 1;   
        return Ok(());
    }

}

#[derive(Accounts)]
pub struct CreateSeparateCounter<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(init, 
        payer = authority,
        space=Counter::SIZE,
        seeds = [b"counter".as_ref(), authority.key().as_ref()],
        bump)
    ]
    pub counter: Account<'info, Counter>,
    pub system_program: Program<'info, System>,
}



#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(init, 
        payer = authority,
        space=Counter::SIZE,
        seeds = [b"counter"],
        bump)
    ]
    pub counter: Account<'info, Counter>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(
        mut,
        seeds = [b"counter"],
        bump = counter.bump
    )]
    counter: Account<'info, Counter>,
    authority: Signer<'info>,
}

#[account]
pub struct Counter {
    pub authority: Pubkey,
    pub count: u64,
    pub bump: u8
}

impl Counter {
    pub const SIZE: usize = 8 + 32 + 8 + 1;
}

