// Adaptive Lexile Calculation Service
// Adjusts student lexile based on quiz performance and book difficulty

interface LexileAdjustment {
  newLexile: number;
  change: number;
  reason: string;
}

/**
 * Calculate lexile adjustment based on quiz performance
 * @param currentLexile - Student's current lexile level
 * @param bookLexile - Book's lexile level
 * @param scorePercentage - Quiz score as percentage (0-100)
 * @returns New lexile level and adjustment details
 */
export function calculateLexileAdjustment(
  currentLexile: number,
  bookLexile: number,
  scorePercentage: number
): LexileAdjustment {
  const lexileDiff = bookLexile - currentLexile;
  const isChallengingBook = lexileDiff > 50; // Book is significantly harder
  const isEasyBook = lexileDiff < -50; // Book is significantly easier
  const isJustRight = !isChallengingBook && !isEasyBook;

  // Base adjustment scales with score
  const baseAdjustment = Math.floor((scorePercentage - 50) / 10); // -5 to +5

  let adjustment = 0;
  let reason = '';

  // LOW LEXILE → HIGH LEXILE (Challenging book)
  if (isChallengingBook) {
    if (scorePercentage >= 80) {
      // High score on hard book = BIG reward
      adjustment = Math.min(30, Math.abs(lexileDiff) / 2);
      reason = 'Excellent performance on challenging material! 🌟';
    } else if (scorePercentage >= 60) {
      // Decent score on hard book = Good reward
      adjustment = Math.min(20, Math.abs(lexileDiff) / 3);
      reason = 'Good effort on challenging material! 📚';
    } else {
      // Low score on hard book = Small punishment
      adjustment = Math.max(-5, baseAdjustment);
      reason = 'Keep practicing with challenging material 💪';
    }
  }
  // HIGH LEXILE → LOW LEXILE (Easy book)
  else if (isEasyBook) {
    if (scorePercentage >= 90) {
      // High score on easy book = Small reward
      adjustment = Math.min(10, Math.abs(baseAdjustment));
      reason = 'Great work! Try more challenging books 🎯';
    } else if (scorePercentage >= 70) {
      // Okay score on easy book = Minimal reward
      adjustment = Math.min(5, baseAdjustment);
      reason = 'Good, but you can do better! 📖';
    } else {
      // Low score on easy book = BIG punishment
      adjustment = Math.max(-25, baseAdjustment * 2);
      reason = 'Review the fundamentals before moving on ⚠️';
    }
  }
  // JUST RIGHT (Within 50L range)
  else {
    if (scorePercentage >= 85) {
      // Great score at right level = Good reward
      adjustment = 15;
      reason = 'Perfect level! Keep up the great work! ⭐';
    } else if (scorePercentage >= 70) {
      // Good score at right level = Normal reward
      adjustment = 10;
      reason = 'Nice progress at your level! 📈';
    } else if (scorePercentage >= 60) {
      // Okay score at right level = Small reward
      adjustment = 5;
      reason = 'Keep practicing at this level 📚';
    } else {
      // Low score at right level = Small punishment
      adjustment = -5;
      reason = 'Take time to understand the material 🤔';
    }
  }

  // Cap adjustments to prevent extreme jumps
  adjustment = Math.max(-30, Math.min(30, adjustment));

  // Calculate new lexile (never go below 0)
  const newLexile = Math.max(0, currentLexile + adjustment);

  return {
    newLexile,
    change: adjustment,
    reason
  };
}

/**
 * Format lexile change for display
 */
export function formatLexileChange(change: number): string {
  if (change > 0) return `+${change}L`;
  if (change < 0) return `${change}L`;
  return 'No change';
}
