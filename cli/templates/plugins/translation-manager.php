<?php
/**
 * Translation Manager config.php
 *
 * This file exists only as a template for the Translation Manager settings.
 * It does nothing on its own.
 *
 * Don't edit this file, instead copy it to 'craft/config' as 'translation-manager.php'
 * and make your changes there to override default settings.
 *
 * Once copied to 'craft/config', this file will be multi-environment aware as
 * well, so you can have different settings groups for each environment, just as
 * you do for 'general.php'
 *
 * @since 1.0.0
 */

use craft\helpers\App;

return [
    // Global settings
    '*' => [
        // ========================================
        // GENERAL SETTINGS
        // ========================================
        // Basic plugin configuration

        'pluginName' => 'Translation Manager',
        'logLevel' => 'error',         // Log level: 'debug', 'info', 'warning', 'error'


        // ========================================
        // TRANSLATION SOURCES
        // ========================================
        // Configure which translation sources to capture

        // Site Translations
        'enableSiteTranslations' => true,
        'translationCategory' => App::env('PRIMARY_TRANSLATION_CATEGORY') ?: 'messages', // Set by the starter prompt
        'sourceLanguage' => App::env('PRIMARY_SITE_LANGUAGE') ?: 'en', // Primary source language

        // Site Translation Skip Patterns
        // Text patterns to skip when capturing site translations (array of strings to skip)
        'skipPatterns' => [
            // 'ID',
            // 'Title',
            // 'Status',
        ],

        // Auto-Capture (Runtime)
        // Automatically add translations when they're used but don't exist
        'captureMissingTranslations' => false,  // Enable runtime capture of missing translations
        'captureMissingOnlyDevMode' => true,    // Only capture when Craft is in devMode (recommended)

        // Form Integrations
        'enableFormieIntegration' => true,
        'enableFreeformIntegration' => true,

        // Form Exclusion Patterns
        // Forms with handles OR titles containing these patterns will be skipped entirely (case-insensitive)
        // Useful for excluding language-specific duplicates like 'booking-ar' or 'Contact Form (Ar)'
        'excludeFormHandlePatterns' => [
            // '(Ar)',     // Matches form titles like "Geely Service Survey (Ar)"
            // '(ar)',     // Matches form titles like "Contact Form (ar)"
            // 'Ar1',      // Matches handles like offersBmwX1X2Ar11, fantasypremiurleagueAr11
            // 'PricesAr', // Matches handles like offersGeelySpecialPricesAr
        ],


        // ========================================
        // FILE GENERATION
        // ========================================
        // PHP translation file generation settings

        'autoGenerate' => true,          // Automatically generate translation files when translations are saved
        'runtimeTranslationSource' => 'php-files', // Options: php-files, database, hybrid
        'generationPath' => '@translations', // Path where PHP translation files should be generated


        // ========================================
        // BACKUP SETTINGS
        // ========================================
        // Backup configuration and retention

        'backupEnabled' => true,
        'backupSchedule' => 'disabled', // Options: 'disabled', 'daily', 'weekly', 'monthly'
        'backupRetentionDays' => 30,   // Number of days to keep automatic backups (0 = keep forever)
        'backupOnImport' => true,      // Automatically create backup before importing CSV files
        'backupPath' => '@storage/translation-manager/backups',
        'backupVolumeUid' => null,     // Optional: Asset volume UID for backups


        // ========================================
        // INTERFACE SETTINGS
        // ========================================
        // Control panel interface options

        'itemsPerPage' => 100,         // Number of translations to show per page
        'requireApproval' => false,    // If true, translators save to draft and approvers publish as translated

        // Auto-save Settings
        'autoSaveEnabled' => false,    // Automatically save each translation when you click outside the field


        // ========================================
        // BASE PLUGIN OVERRIDES
        // ========================================
        // These settings override lindemannrock-base defaults for this plugin only.
        // Global defaults: vendor/lindemannrock/craft-plugin-base/src/config.php
        // To customize globally: copy to config/lindemannrock-base.php

        /**
         * Date/time formatting overrides
         * Override base plugin date/time display settings for this plugin
         * Defaults: from config/lindemannrock-base.php
         */
        // 'timeFormat' => '24',      // '12' (AM/PM) or '24' (military)
        // 'monthFormat' => 'short',  // 'numeric' (01), 'short' (Jan), 'long' (January)
        // 'dateOrder' => 'dmy',      // 'dmy', 'mdy', 'ymd'
        // 'dateSeparator' => '/',    // '/', '-', '.'
        // 'showSeconds' => false,    // Show seconds in time display

        /**
         * Export format overrides
         * Enable/disable specific export formats for this plugin
         * Default: CSV and Excel enabled, JSON disabled (developer format — from base plugin)
         */
        // 'exports' => [
        //     'csv' => true,
        //     'json' => true,
        //     'excel' => true,
        // ],
    ],

    // Dev environment settings
    'dev' => [
        'logLevel' => 'debug',         // More detailed logging in development
        'autoGenerate' => false,         // Manual generation in dev
        'backupSchedule' => 'disabled', // Manual backups in dev
        // 'captureMissingTranslations' => true, // Uncomment to auto-capture in dev
    ],

    // Staging environment settings
    'staging' => [
        'logLevel' => 'info',          // Moderate logging in staging
        'autoGenerate' => true,
        'backupSchedule' => 'weekly',
    ],

    // Production environment settings
    'production' => [
        'logLevel' => 'warning',       // Less verbose logging in production
        'autoGenerate' => true,
        'backupEnabled' => true,
        'backupSchedule' => 'daily',
        // 'backupVolumeUid' => 'your-volume-uid-here', // Use asset volume in production
    ],
];
