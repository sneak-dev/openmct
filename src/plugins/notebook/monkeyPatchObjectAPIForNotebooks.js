import { isAnnotationType, isNotebookType, isNotebookOrAnnotationType } from './notebook-constants';
import _ from 'lodash';

export default function (openmct) {
    const apiSave = openmct.objects.save.bind(openmct.objects);

    openmct.objects.save = async (domainObject) => {
        if (!isNotebookOrAnnotationType(domainObject)) {
            return apiSave(domainObject);
        }

        const isNewMutable = !domainObject.isMutable;
        const localMutable = openmct.objects.toMutable(domainObject);
        let result;

        try {
            result = await apiSave(localMutable);
        } catch (error) {
            if (error instanceof openmct.objects.errors.Conflict) {
                result = await resolveConflicts(domainObject, localMutable, openmct);
            } else {
                result = Promise.reject(error);
            }
        } finally {
            if (isNewMutable) {
                openmct.objects.destroyMutable(localMutable);
            }
        }

        return result;
    };
}

function resolveConflicts(domainObject, localMutable, openmct) {
    if (isNotebookType(domainObject)) {
        return resolveNotebookEntryConflicts(localMutable, openmct);
    } else if (isAnnotationType(domainObject)) {
        return resolveNotebookTagConflicts(localMutable, openmct);
    }
}

async function resolveNotebookTagConflicts(localAnnotation, openmct) {
    const localClonedAnnotation = structuredClone(localAnnotation);
    const remoteMutable = await openmct.objects.getMutable(localClonedAnnotation.identifier);

    // should only be one annotation per targetID, entryID, and tag; so for sanity, ensure we have the
    // same targetID, entryID, and tags for this conflict
    if (!(_.isEqual(remoteMutable.tags, localClonedAnnotation.tags))) {
        throw new Error('Conflict on annotation\'s tag has different tags than remote');
    }

    Object.keys(localClonedAnnotation.targets).forEach(targetKey => {
        if (!remoteMutable.targets[targetKey]) {
            throw new Error(`Conflict on annotation's target is missing ${targetKey}`);
        }

        const remoteMutableTarget = remoteMutable.targets[targetKey];
        const localMutableTarget = localClonedAnnotation.targets[targetKey];

        if (remoteMutableTarget.entryId !== localMutableTarget.entryId) {
            throw new Error(`Conflict on annotation's entryID ${remoteMutableTarget.entryId} has a different entry Id ${localMutableTarget.entryId}`);
        }
    });

    if (remoteMutable._deleted && (remoteMutable._deleted !== localClonedAnnotation._deleted)) {
        // not deleting wins 😘
        openmct.objects.mutate(remoteMutable, '_deleted', false);
    }

    openmct.objects.destroyMutable(remoteMutable);

    return true;
}

async function resolveNotebookEntryConflicts(localMutable, openmct) {
    if (localMutable.configuration.entries) {
        const localEntries = structuredClone(localMutable.configuration.entries);
        const remoteMutable = await openmct.objects.getMutable(localMutable.identifier);
        applyLocalEntries(remoteMutable, localEntries, openmct);
        openmct.objects.destroyMutable(remoteMutable);
    }

    return true;
}

function applyLocalEntries(mutable, entries, openmct) {
    Object.entries(entries).forEach(([sectionKey, pagesInSection]) => {
        Object.entries(pagesInSection).forEach(([pageKey, localEntries]) => {
            const remoteEntries = mutable.configuration.entries[sectionKey][pageKey];
            const mergedEntries = [].concat(remoteEntries);
            let shouldMutate = false;

            const locallyAddedEntries = _.differenceBy(localEntries, remoteEntries, 'id');
            const locallyModifiedEntries = _.differenceWith(localEntries, remoteEntries, (localEntry, remoteEntry) => {
                return localEntry.id === remoteEntry.id && localEntry.text === remoteEntry.text;
            });

            locallyAddedEntries.forEach((localEntry) => {
                mergedEntries.push(localEntry);
                shouldMutate = true;
            });

            locallyModifiedEntries.forEach((locallyModifiedEntry) => {
                let mergedEntry = mergedEntries.find(entry => entry.id === locallyModifiedEntry.id);
                if (mergedEntry !== undefined
                    && locallyModifiedEntry.text.match(/\S/)) {
                    mergedEntry.text = locallyModifiedEntry.text;
                    shouldMutate = true;
                }
            });

            if (shouldMutate) {
                openmct.objects.mutate(mutable, `configuration.entries.${sectionKey}.${pageKey}`, mergedEntries);
            }
        });
    });
}
