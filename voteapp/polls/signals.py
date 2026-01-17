from django.db.models.signals import post_save
from django.dispatch import receiver
from polls.models import Poll
from polls.services import finalize_poll_results


@receiver(post_save, sender=Poll)
def auto_finalize_poll(sender, instance, created, update_fields, **kwargs):
    """
    Automatically finalize poll results when status changes to 'closed'.
    This signal fires after a Poll is saved.
    """
    # Skip on creation or if update_fields is specified but doesn't include 'status'
    if created:
        return
    
    if update_fields and 'status' not in update_fields:
        return
    
    # Only finalize if status is 'closed' and no result exists yet
    if instance.status == "closed" and not hasattr(instance, 'result'):
        try:
            finalize_poll_results(instance)
        except ValueError:
            # Poll might still be open or already finalized, skip silently
            pass
