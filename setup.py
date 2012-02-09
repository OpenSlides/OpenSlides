from setuptools import setup
from setuptools import find_packages
from openslides import get_version

setup(
    name='openslides',
    description='Presentation-System',
    version=get_version(),
    url='http://openslides.org',
    author='OpenSlides-Team',
    author_email='support@openslides.org',
    license='GPL2+',
    packages=find_packages(),
    include_package_data = True,
    classifiers = [
        # http://pypi.python.org/pypi?%3Aaction=list_classifiers
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'Intended Audience :: Other Audience',
        'Framework :: Django',
        'License :: OSI Approved :: GNU General Public License (GPL)',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
    ],
    setup_requires=[
        'versiontools >= 1.6',
    ],
    install_requires=[
        'django >= 1.3',
        'reportlab',
        'pil',
    ]
)
