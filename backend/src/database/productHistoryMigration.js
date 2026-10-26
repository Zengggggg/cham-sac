export const productHistoryActorMigrationFilter = {
    'changeHistory.changedBy': { $type: 'string' }
};

export const productHistoryActorMigrationPipeline = [
    {
        $set: {
            changeHistory: {
                $map: {
                    input: { $ifNull: ['$changeHistory', []] },
                    as: 'event',
                    in: {
                        $mergeObjects: [
                            '$$event',
                            {
                                changedBy: {
                                    $cond: [
                                        { $eq: [{ $type: '$$event.changedBy' }, 'string'] },
                                        {
                                            $convert: {
                                                input: '$$event.changedBy',
                                                to: 'objectId',
                                                onError: null,
                                                onNull: null
                                            }
                                        },
                                        '$$event.changedBy'
                                    ]
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
];

export const invalidProductHistoryActorFilter = {
    'changeHistory.changedBy': {
        $type: 'string',
        $not: /^[0-9a-f]{24}$/i
    }
};
