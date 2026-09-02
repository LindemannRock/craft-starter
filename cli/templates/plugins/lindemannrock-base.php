<?php
/**
 * LindemannRock Base config.php
 *
 * This file exists only as a template for the LindemannRock Base settings.
 * It does nothing on its own.
 *
 * Don't edit this file, instead copy it to 'craft/config' as 'lindemannrock-base.php'
 * and make your changes there to override default settings.
 *
 * Centralized settings for all LindemannRock plugins.
 * These settings affect display in templates, AJAX responses, and exports.
 *
 * @since 5.14.0
 */

return [
    // =========================================================================
    // Date/Time Formatting
    // =========================================================================

    // Time format: '12' (AM/PM) or '24' (military/24-hour)
    'timeFormat' => '24',

    // Month format: 'numeric' (01), 'short' (Jan), 'long' (January)
    'monthFormat' => 'short',

    // Date order: 'dmy' (22/01/2026), 'mdy' (01/22/2026), 'ymd' (2026/01/22)
    'dateOrder' => 'dmy',

    // Date separator: '/', '-', '.'
    'dateSeparator' => '/',

    // Show seconds by default in time display (can be overridden per-call)
    'showSeconds' => false,

    // =========================================================================
    // Export Formats
    // =========================================================================

    // Enable/disable export formats globally
    // Defaults: excel=true, csv=true, json=false
    'exports' => [
        'excel' => true,   // .xlsx files (requires phpspreadsheet)
        'csv' => true,     // .csv files
        'json' => false,   // .json files (developer format)
    ],

    // =========================================================================
    // Default Date Range
    // =========================================================================

    // Default date range for analytics, logs, dashboards, and any date-filtered pages
    // Options: 'today', 'yesterday', 'thisWeek', 'lastWeek', 'last7days',
    //          'last14days', 'last30days', 'last90days', 'thisMonth',
    //          'lastMonth', 'thisQuarter', 'lastQuarter', 'thisYear',
    //          'lastYear', 'last12months', 'all'
    'defaultDateRange' => 'last30days',
];
