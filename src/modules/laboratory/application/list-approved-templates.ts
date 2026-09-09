import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type {
  ApprovedLabTemplateOption,
  ControlledLabSources,
} from '../ports/controlled-sources.js';

/**
 * Selector source for the laboratory-test creation form (F-06).
 *
 * Lists approved controlled template versions only. Authorization reuses the
 * exact predicate the creation form itself requires (`PERM-LAB-CREATE` on a
 * prospective DRAFT): an actor who may not create a lab test learns nothing
 * about the controlled template catalog from this selector. Template
 * administration itself stays policy-blocked (F-10): this use case can never
 * create, approve, or retire a template version.
 */
export class ListApprovedLabTemplatesUseCase {
  constructor(private readonly sources: ControlledLabSources) {}

  async execute(input: { actor: ActorContext }): Promise<readonly ApprovedLabTemplateOption[]> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-LAB-CREATE',
        action: 'CREATE',
        entity: { type: 'LAB_TEST', id: 'new', state: 'DRAFT', authorId: input.actor.id },
        scope: { ownerId: input.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return this.sources.listApprovedTemplates();
  }
}
