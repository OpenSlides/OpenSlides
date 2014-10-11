from openslides.projector.api import register_slide_model

from .models import User

register_slide_model(User, 'participant/user_slide.html')
