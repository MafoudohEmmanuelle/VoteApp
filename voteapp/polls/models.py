import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError

class Poll(models.Model):
    """
    Poll aggregate root.
    Redis stores votes; Django ensures poll integrity and lifecycle.
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("scheduled", "Scheduled"),
        ("open", "Open"),
        ("closed", "Closed"),
    ]

    VOTING_MODE_CHOICES = [
        ("open", "Open voting"),
        ("restricted", "Restricted voting"),
    ]

    # Public identifier for shareable link
    public_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="polls"
    )

    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()

    is_public = models.BooleanField(default=True)

    voting_mode = models.CharField(
        max_length=10,
        choices=VOTING_MODE_CHOICES,
        default="open"
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="draft"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def clean(self):
        """
        Validate poll scheduling rules.
        """
        if self.starts_at >= self.ends_at:
            raise ValidationError("Poll end time must be after start time")

    def update_status(self):
        """
        Update poll status based on current time.
        This method MUST be called before voting or displaying status.
        """
        now = timezone.now()

        if self.starts_at <= now < self.ends_at:
            self.status = "open"
        elif now >= self.ends_at:
            self.status = "closed"
        else:
            self.status = "scheduled"

        self.save(update_fields=["status"])
    
    def is_open(self):
        """
        Authoritative check for voting availability.
        """
        return self.status == "open"

class Choice(models.Model):
    """
    Voting option belonging to a Poll.
    """
    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name="choices"
    )

    text = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.text} (Poll: {self.poll.title})"

class PollResult(models.Model):
    """
    Stores finalized poll results after closure.
    Redis → Django persistence boundary.
    """

    poll = models.OneToOneField(
        Poll,
        on_delete=models.CASCADE,
        related_name="result"
    )

    # Example:
    # { "1": 45, "2": 30 }
    results = models.JSONField()

    total_votes = models.PositiveIntegerField()

    finalized_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Results for poll {self.poll.title}"
