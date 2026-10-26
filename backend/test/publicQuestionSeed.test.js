import assert from 'node:assert/strict';
import test from 'node:test';
import heritageSiteSeeds from '../scripts/data/heritageSites.js';
import publicQuestionSeeds from '../scripts/data/publicQuestions.js';

test('public question seed covers nine unique heritage sites with valid questions', () => {
    assert.equal(publicQuestionSeeds.length, 9);
    assert.equal(heritageSiteSeeds.length, 9);

    const primarySiteNames = new Set();
    const heritageSiteNames = new Set(heritageSiteSeeds.map((site) => site.name));

    for (const seed of publicQuestionSeeds) {
        assert.ok(Array.isArray(seed.siteNames));
        assert.ok(seed.siteNames.length > 0);
        assert.ok(!primarySiteNames.has(seed.siteNames[0]));
        primarySiteNames.add(seed.siteNames[0]);
        assert.ok(heritageSiteNames.has(seed.siteNames[0]));

        assert.ok(seed.questions.length >= 10);
        assert.ok(seed.questions.length <= 100);
        assert.equal(
            new Set(seed.questions.map((question) => question.content)).size,
            seed.questions.length
        );

        for (const question of seed.questions) {
            assert.equal(question.content, question.content.trim());
            assert.ok(question.content.length >= 3);
            assert.ok(question.content.length <= 500);
            assert.ok(question.content.endsWith('?'));
            assert.equal(question.options.length, 4);
            assert.ok(question.options.every((option) => option === option.trim()));
            assert.ok(Number.isInteger(question.correctOptionIndex));
            assert.ok(question.correctOptionIndex >= 0);
            assert.ok(question.correctOptionIndex < question.options.length);
        }
    }
});

test('heritage site seed provides valid content and local source images', () => {
    for (const site of heritageSiteSeeds) {
        assert.ok(site.name.length >= 2);
        assert.match(site.slug, /^[a-z0-9-]+$/);
        assert.match(site.imageFile, /^[a-z0-9-]+\.jpg$/);
        assert.ok(site.shortDescription.length <= 1000);
        assert.ok(site.content.length <= 100000);
    }
});
