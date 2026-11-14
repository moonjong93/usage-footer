# usage-footer

A Claude Code mod that shows your session's status at the bottom right of the prompt footer: the model with a one-letter effort level, context usage, and the 5-hour and weekly usage limits, each with a progress bar and the time left until it resets.

```
Sonnet 5.5 H · ctx ██░░ 42% · 5h █░░░ 23% 3h32m · 7d ░░░░ 10% 5d4h
```

- Effort is one letter, colored: L (low), M (medium), H (high), X (xhigh), Mx (max).
- ctx, 5h and 7d are all the share **used**. The time after 5h and 7d is how long until the window resets.
- 5h and 7d need a Claude subscription; otherwise they show `–`. Values fill in after the first response of a session.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install usage-footer --marketplace moonjong93/usage-footer
```

Answer `y` to add the marketplace, then pick a scope (user to have it in every session). From a shell:

```
claude plugin install usage-footer --marketplace moonjong93/usage-footer
```

## License

MIT
