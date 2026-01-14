from django.contrib.auth.models import User
from rest_framework import serializers
from polls.models import Poll, Choice

# -----------------------------
# User Serializers
# -----------------------------

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password2",
        ]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Passwords must match"})

        if User.objects.filter(username=data.get("username")).exists():
            raise serializers.ValidationError({"username": "A user with that username already exists."})

        email = data.get("email")
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})

        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(**validated_data)

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

# -----------------------------
# Choice Serializers
# -----------------------------

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ["id", "text", "order"]

class ChoiceCreateSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=255)
    order = serializers.IntegerField(required=False)

# -----------------------------
# Poll Serializers
# -----------------------------

class PollSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    choices = ChoiceSerializer(many=True, read_only=True)
    is_open = serializers.SerializerMethodField()
    poll_link = serializers.SerializerMethodField()

    class Meta:
        model = Poll
        fields = [
            "public_id",
            "title",
            "description",
            "created_by",
            "starts_at",
            "ends_at",
            "is_open",
            "is_public",
            "created_at",
            "choices",
            "status",
            "voting_mode",
            "poll_link",
        ]

    def get_is_open(self, obj):
        obj.update_status()
        return obj.is_open()

    def get_poll_link(self, obj):
        request = self.context.get("request")
        path = f"/vote/{obj.public_id}"
        if request:
            return request.build_absolute_uri(path)
        return path

class PollCreateSerializer(serializers.ModelSerializer):
    choices = ChoiceCreateSerializer(many=True)

    class Meta:
        model = Poll
        fields = [
            "title",
            "description",
            "starts_at",
            "ends_at",
            "is_public",
            "voting_mode",
            "choices",
        ]

    def validate(self, data):
        if data["starts_at"] >= data["ends_at"]:
            raise serializers.ValidationError("Poll end time must be after start time")

        if len(data["choices"]) < 2:
            raise serializers.ValidationError("A poll must have at least two choices")

        return data

    def create(self, validated_data):
        choices_data = validated_data.pop("choices")
        user = self.context["request"].user

        poll = Poll.objects.create(
            created_by=user,
            status="draft",
            **validated_data
        )

        for index, choice_data in enumerate(choices_data):
            Choice.objects.create(
                poll=poll,
                text=choice_data["text"],
                order=choice_data.get("order", index)
            )

        return poll
