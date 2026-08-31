const { expect } = require('chai');
const { generateUserPreferences } = require('./common');
let db = null;

describe('UserPreferences', () => {
    before(async () => {
        db = global.testParams.db;
    });

    it('should return null for non-existing userName', async () => {
        const response = await db.userPreferences.fetch({ userName: 'no-such-user' });
        expect(response).to.be.null;
    });

    it('should replace (upsert) and fetch preferences', async () => {
        const prefs = generateUserPreferences();
        await db.userPreferences.replace(prefs);
        const res = await db.userPreferences.fetch({ userName: prefs.userName });
        expect(res.userName).to.eql(prefs.userName);
        expect(res.theme).to.eql(prefs.theme);
        expect(res.scoopIntervalHours).to.eql(prefs.scoopIntervalHours);
        expect(res.tables).to.eql(prefs.tables);
    });

    it('should replace existing preferences entirely', async () => {
        const prefs = generateUserPreferences({ theme: 'dark' });
        await db.userPreferences.replace(prefs);

        const updated = {
            ...prefs,
            theme: 'lightsOut',
            scoopIntervalHours: 720,
            tables: {
                jobs: { columns: { name: { visible: true, width: 200 } } },
                algorithms: { columns: {} },
                pipelines: { columns: {} },
            },
            updatedAt: new Date().toISOString(),
        };
        await db.userPreferences.replace(updated);

        const res = await db.userPreferences.fetch({ userName: prefs.userName });
        expect(res.theme).to.eql('lightsOut');
        expect(res.scoopIntervalHours).to.eql(720);
        expect(res.tables.jobs.columns.name.visible).to.eql(true);
    });

    it('should delete preferences', async () => {
        const prefs = generateUserPreferences();
        await db.userPreferences.replace(prefs);
        const res = await db.userPreferences.delete({ userName: prefs.userName });
        expect(res).to.eql({ deleted: 1 });
        const fetched = await db.userPreferences.fetch({ userName: prefs.userName });
        expect(fetched).to.be.null;
    });

    it('should not throw when deleting non-existing preferences', async () => {
        const res = await db.userPreferences.delete({ userName: 'non-existing-user' });
        expect(res).to.eql({ deleted: 0 });
    });

    it('should handle multiple users independently', async () => {
        const prefs1 = generateUserPreferences({ theme: 'dark' });
        const prefs2 = generateUserPreferences({ theme: 'light' });
        await db.userPreferences.replace(prefs1);
        await db.userPreferences.replace(prefs2);

        const res1 = await db.userPreferences.fetch({ userName: prefs1.userName });
        const res2 = await db.userPreferences.fetch({ userName: prefs2.userName });
        expect(res1.theme).to.eql('dark');
        expect(res2.theme).to.eql('light');
    });

    it('should store nested table column settings', async () => {
        const prefs = generateUserPreferences({
            tables: {
                jobs: {
                    columns: {
                        name: { visible: true, width: 200 },
                        status: { visible: false, width: 120 },
                    },
                },
                algorithms: { columns: { name: { visible: true, width: 300 } } },
                pipelines: { columns: {} },
            },
        });
        await db.userPreferences.replace(prefs);
        const res = await db.userPreferences.fetch({ userName: prefs.userName });
        expect(res.tables.jobs.columns.name.width).to.eql(200);
        expect(res.tables.jobs.columns.status.visible).to.eql(false);
        expect(res.tables.algorithms.columns.name.width).to.eql(300);
    });
});
