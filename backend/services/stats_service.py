
import scipy.stats as stats

# Stats constants (Mean, Std Dev)
# Stats constants (Mean, Std Dev)
STATS_DATA = {
    'reaction_time': {'mean': 300, 'std_dev': 50, 'lower_is_better': True},
    'reaction_time_hard': {'mean': 350, 'std_dev': 80, 'lower_is_better': True},
    'sequence_memory': {'mean': 8, 'std_dev': 2.5, 'lower_is_better': False},
    'aim_trainer': {'mean': 500, 'std_dev': 120, 'lower_is_better': True},
    'aim_trainer_hard': {'mean': 800, 'std_dev': 150, 'lower_is_better': True},
    'number_memory': {'mean': 9, 'std_dev': 2.5, 'lower_is_better': False},
    'number_memory_hard': {'mean': 6, 'std_dev': 2.0, 'lower_is_better': False},
    'chimp_test': {'mean': 10, 'std_dev': 2.5, 'lower_is_better': False},
    'chimp_test_hard': {'mean': 12, 'std_dev': 4, 'lower_is_better': False},
    'type_flow': {'mean': 50, 'std_dev': 15, 'lower_is_better': False},
    'verbal_hard': {'mean': 25, 'std_dev': 10, 'lower_is_better': False},
    'visual_hard': {'mean': 8, 'std_dev': 3, 'lower_is_better': False},
    'aim_hard': {'mean': 5000, 'std_dev': 2000, 'lower_is_better': False},
    'stroop_hard': {'mean': 30, 'std_dev': 10, 'lower_is_better': False},
    'n_back': {'mean': 3, 'std_dev': 1.2, 'lower_is_better': False},
    'schulte_normal': {'mean': 18000, 'std_dev': 5000, 'lower_is_better': True},
    'schulte_dynamic': {'mean': 35000, 'std_dev': 10000, 'lower_is_better': True},
    'schulte_mixed': {'mean': 25000, 'std_dev': 8000, 'lower_is_better': True},
    'math_fall': {'mean': 2000, 'std_dev': 800, 'lower_is_better': False}
}

def calculate_percentile(game_type, score):
    """
    Calculates the percentile of a score relative to the population.
    """
    if game_type not in STATS_DATA:
        return 0.0

    data = STATS_DATA[game_type]
    mean = data['mean']
    std_dev = data['std_dev']
    lower_is_better = data.get('lower_is_better', False)

    # CDF gives percentage of population scoring <= score.
    cdf = stats.norm.cdf(score, loc=mean, scale=std_dev) * 100

    if lower_is_better:
        # If lower is better (e.g. time), and I scored low, CDF is small.
        # But low score means I beat many people (High Percentile).
        # Example: Mean=300. I score 200. CDF(200) is small (~2%).
        # It means only 2% people are faster than 200 (if distribution assumes lower numbers are tail? Wait).
        # Normal distribution X axis is Time. 
        # Area to left of 200 is "People faster than 200" ? No.
        # If Time is X. Small X = Fast.
        # P(X < 200) is probability of someone being faster than 200.
        # If P(X < 200) is 2%, then 2% of people are faster than me.
        # So I am faster than 98% of people.
        # So my percentile (performance) is 98%.
        # So if lower is better, Percentile = 100 - CDF.
        percentile = 100 - cdf
    else:
        # Higher is better (e.g. score).
        # I score 12 (Mean 8). CDF(12) is high (~95%).
        # I am better than 95% of people.
        percentile = cdf

    return round(percentile, 2)
